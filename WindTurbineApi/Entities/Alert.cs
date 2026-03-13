using System.ComponentModel.DataAnnotations; // من أجل تحديد طول النصوص
using System.ComponentModel.DataAnnotations.Schema;

namespace WindTurbineApi.Entities; // 1. تصحيح المساحة الاسمية لتطابق المجلد

public class Alert
{
    [Key] // تحديد المفتاح الأساسي
    [MaxLength(50)] // 2. تحديد طول النص لمنع مشاكل الأداء في قاعدة البيانات
    public required string Id { get; init; } // 3. استخدام init ليكون الكائن غير قابل للتعديل بعد الإنشاء

    [MaxLength(50)]
    public required string TurbineId { get; init; }

    [MaxLength(500)] // تحديد سعة كافية للرسالة مع حماية قاعدة البيانات
    public string? Message { get; init; }

    public DateTime Timestamp { get; init; }
}