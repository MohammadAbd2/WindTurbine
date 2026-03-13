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

// ================= MQTT =================
builder.Services.AddMqttControllers();

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173",
                           "https://wind-turbine-ui.fly.dev/"
                ) 
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
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
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

// إعداد Swagger ليعمل على الرابط الرئيسي
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Wind Turbine API v1");
        // جعل المسار فارغاً ليعمل Swagger عند http://localhost:5000/ مباشرة
        options.RoutePrefix = string.Empty; 
    });
}

app.UseCors("ReactPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ================= MQTT CONNECTION =================
using (var scope = app.Services.CreateScope())
{
    var mqtt = scope.ServiceProvider.GetRequiredService<IMqttClientService>();
    await mqtt.ConnectAsync("broker.hivemq.com", 1883);
    await mqtt.SubscribeAsync("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry");
    await mqtt.SubscribeAsync("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/alert");
}

app.Run();