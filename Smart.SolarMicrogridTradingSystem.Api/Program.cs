/*
 * File: Program.cs
 * Description: Contains the implementation for Program.
 * Author: Smart Solar Microgrid Trading System Team
 */
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Text;
using Smart.SolarMicrogridTradingSystem.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var mongoSettings = builder.Configuration.GetSection("MongoDbSettings");
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(mongoSettings.GetValue<string>("ConnectionString")));
builder.Services.AddScoped(s =>
    s.GetService<IMongoClient>()!.GetDatabase(mongoSettings.GetValue<string>("DatabaseName")));

var cloudinarySettings = builder.Configuration.GetSection("CloudinarySettings");
builder.Services.AddSingleton(s => new Cloudinary(new Account(
    cloudinarySettings.GetValue<string>("CloudName"),
    cloudinarySettings.GetValue<string>("ApiKey"),
    cloudinarySettings.GetValue<string>("ApiSecret")
))
{ Api = { Secure = true } });

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.ASCII.GetBytes(jwtSettings.GetValue<string>("Secret")!);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

builder.Services.AddApplicationServices();

var app = builder.Build();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await Smart.SolarMicrogridTradingSystem.Api.Utils.DataSeeder.SeedAsync(app.Services);
await Smart.SolarMicrogridTradingSystem.Api.Utils.DataSeeder.SeedProsumerAndReservationFeaturesAsync(app.Services);

app.Run();
