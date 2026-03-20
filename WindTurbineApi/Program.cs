using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WindTurbineApi.Data;
using Mqtt.Controllers;
using StateleSSE.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddInMemorySseBackplane();
var configuration = builder.Configuration;
var environment = builder.Environment;

// ================= DATABASE =================
var connectionString = ResolveConnectionString(configuration);
builder.Services.AddDbContext<WindTurbineDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// ================= CONTROLLERS & JSON =================
builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddMqttControllers();

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        var allowedOrigins = ResolveAllowedOrigins(configuration);
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ================= JWT =================
var jwtKey = configuration["Jwt:Key"] ?? "THIS_IS_A_SUPER_SECRET_KEY_123456789012345";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(configuration["Jwt:Issuer"]),
            ValidateAudience = !string.IsNullOrWhiteSpace(configuration["Jwt:Audience"]),
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidAudience = configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

builder.Services.AddAuthorization();

// ================= SWAGGER CONFIG =================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Wind Turbine API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Bearer token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme }
            },
            Array.Empty<string>()
        }
    }); 
});




var app = builder.Build();

// ================= PIPELINE =================
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Wind Turbine API v1");
    options.RoutePrefix = string.Empty; 
});

app.UseCors("ReactPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok", environment = environment.EnvironmentName }));
app.MapControllers();

// ================= DATABASE MIGRATIONS & MQTT =================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    await EnsureDatabaseAsync(db, logger);

    var mqtt = scope.ServiceProvider.GetRequiredService<IMqttClientService>();
    await TryStartMqttAsync(mqtt, configuration, logger);
}

app.Run();

static string ResolveConnectionString(IConfiguration configuration)
{
    var databaseUrl = configuration["DATABASE_URL"];
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        return databaseUrl;
    }

    var connectionString = configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("No database connection string was configured.");
    }

    return connectionString;
}

static string[] ResolveAllowedOrigins(IConfiguration configuration)
{
    var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (configuredOrigins is { Length: > 0 })
    {
        return configuredOrigins;
    }

    return
    [
        "http://localhost:5173",
        "https://wind-turbine-ui.fly.dev"
    ];
}

static async Task EnsureDatabaseAsync(WindTurbineDbContext db, ILogger logger)
{
    var migrations = db.Database.GetMigrations();
    if (migrations.Any())
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("Applied Entity Framework migrations.");
        return;
    }

    await db.Database.EnsureCreatedAsync();
    logger.LogInformation("Database ensured without migrations because none were found in the assembly.");
}

static async Task TryStartMqttAsync(IMqttClientService mqtt, IConfiguration configuration, ILogger logger)
{
    var host = configuration["Mqtt:Host"] ?? "broker.hivemq.com";
    var port = int.TryParse(configuration["Mqtt:Port"], out var configuredPort) ? configuredPort : 1883;
    var farmId = configuration["Mqtt:FarmId"] ?? "6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7";

    try
    {
        await mqtt.ConnectAsync(host, port);
        await mqtt.SubscribeAsync($"farm/{farmId}/windmill/+/telemetry");
        await mqtt.SubscribeAsync($"farm/{farmId}/windmill/+/alert");
        logger.LogInformation("MQTT client connected to {Host}:{Port} for farm {FarmId}.", host, port, farmId);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "MQTT startup failed. The API will continue running without live MQTT ingestion.");
    }
}
