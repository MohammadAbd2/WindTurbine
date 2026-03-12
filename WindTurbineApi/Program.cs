using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WindTurbineApi.Data;
using Mqtt.Controllers;

var builder = WebApplication.CreateBuilder(args);

// ================= DATABASE =================
builder.Services.AddDbContext<WindTurbineDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ================= CONTROLLERS =================
builder.Services.AddControllers();

// ================= MQTT =================
builder.Services.AddMqttControllers();
builder.Services.AddHostedService<MqttControllerHostedService>();

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173" // React Vite
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ================= JWT =================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKey123456";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

builder.Services.AddAuthorization();

// ================= SWAGGER =================
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Wind Turbine API",
        Version = "v1",
        Description = "Wind Turbine Monitoring API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Bearer token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ================= PIPELINE =================

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// CORS MUST be before MapControllers
app.UseCors("ReactPolicy");

// Auth
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// ================= MQTT =================
using (var scope = app.Services.CreateScope())
{
    var mqtt = scope.ServiceProvider.GetRequiredService<IMqttClientService>();

    await mqtt.ConnectAsync("broker.hivemq.com", 1883);

    await mqtt.SubscribeAsync(
        "farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry"
    );
}

app.Run();