using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WindTurbineApi.Data;
using Mqtt.Controllers;
using StateleSSE.AspNetCore;
using WindTurbineApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ================= DATABASE =================
builder.Services.AddDbContext<WindTurbineDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
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
        policy.WithOrigins("http://localhost:5173",
                           "https://wind-turbine-ui.fly.dev") // Removed trailing slash for matching
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ================= JWT =================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyWithAtLeast32Characters!";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false, // Set to false if you haven't configured Issuer in Fly secrets yet
            ValidateAudience = false, // Set to false for easier initial deployment
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
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

// Enable Swagger in PRODUCTION so you can test it on Fly.io
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Wind Turbine API v1");
    options.RoutePrefix = string.Empty; 
});

app.UseCors("ReactPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ================= DATABASE MIGRATIONS & MQTT =================
using (var scope = app.Services.CreateScope())
{
    // 1. Run Migrations (This builds your Neon tables)
    var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();
    await db.Database.MigrateAsync();

    // 2. Start MQTT
    var mqtt = scope.ServiceProvider.GetRequiredService<IMqttClientService>();
    await mqtt.ConnectAsync("broker.hivemq.com", 1883);
    await mqtt.SubscribeAsync("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry");
    await mqtt.SubscribeAsync("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/alert");
}

app.Run();