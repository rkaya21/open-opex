"""Create the built-in 5S checklist template inside a tenant schema.

Usage:
    python manage.py tenant_command seed_5s_checklist --schema=acme
"""

from django.core.management.base import BaseCommand

from apps.audits.models import ChecklistItem, ChecklistTemplate

FIVE_S_ITEMS = [
    ("Seiri (Ayıkla)", "Alanda gereksiz malzeme, ekipman veya evrak yok"),
    ("Seiri (Ayıkla)", "Kırmızı etiket alanı tanımlı ve güncel"),
    ("Seiton (Düzenle)", "Her malzemenin tanımlı ve etiketli bir yeri var"),
    ("Seiton (Düzenle)", "Yer çizgileri ve gölge panoları belirgin ve doğru"),
    ("Seiso (Temizle)", "Zemin, makine ve çalışma yüzeyleri temiz"),
    ("Seiso (Temizle)", "Temizlik planı görünür ve imzaları güncel"),
    ("Seiketsu (Standartlaştır)", "5S standartları ve görseller alanda asılı"),
    ("Seiketsu (Standartlaştır)", "Standart dışı durumlar ilk bakışta fark ediliyor"),
    ("Shitsuke (Sürdür)", "Önceki denetim aksiyonları kapatılmış"),
    ("Shitsuke (Sürdür)", "Ekip 5S kurallarını biliyor ve uyguluyor"),
]


class Command(BaseCommand):
    help = "Create the built-in 5S checklist template (idempotent)"

    def handle(self, **options) -> None:
        template, created = ChecklistTemplate.objects.get_or_create(
            name="5S Denetimi",
            defaults={"description": "Yerleşik 5S saha denetim soru seti"},
        )
        if not created:
            self.stdout.write("5S template already exists; skipping")
            return
        ChecklistItem.objects.bulk_create(
            ChecklistItem(template=template, category=category, text=text, order=index)
            for index, (category, text) in enumerate(FIVE_S_ITEMS)
        )
        self.stdout.write(self.style.SUCCESS("5S checklist template created"))
