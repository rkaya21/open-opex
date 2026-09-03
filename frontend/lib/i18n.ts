/** UI strings, centralized. Currently Turkish-only; Phase 4 will move this
 * behind a locale switch (TR/EN) without touching components. */

import type { KpiStatus, ProcessStatus } from "@/lib/types";

export const t = {
  nav: {
    processes: "Süreçler",
    kpis: "KPI'lar",
    logout: "Çıkış",
  },
  common: {
    loading: "Yükleniyor…",
    saving: "Kaydediliyor…",
    save: "Kaydet",
    edit: "Düzenle",
    target: "hedef",
    optional: "opsiyonel",
  },
  home: {
    tagline: "Operasyonel Mükemmellik için açık kaynak, kendi sunucunda çalışan platform.",
    openApp: "Uygulamayı aç",
    modules: [
      {
        title: "Süreç Yönetimi",
        description: "Hiyerarşik süreçler, sahipler, SIPOC tanımları, versiyonlama.",
        phase: "Faz 1",
      },
      {
        title: "KPI & Panolar",
        description: "Hedefler, ölçümler, trendler — OEE, FTQ, hurda şablonları.",
        phase: "Faz 1",
      },
      {
        title: "Sürekli İyileştirme",
        description: "Öneri akışı ve KPI etkisine bağlı PDCA projeleri.",
        phase: "Faz 2",
      },
      {
        title: "Denetim & Aksiyonlar",
        description: "5S'e hazır kontrol listeleri, bulgular, ortak CAPA aksiyon havuzu.",
        phase: "Faz 3",
      },
    ],
  },
  login: {
    title: "Giriş yap",
    subtitle: "Şirket hesabınla giriş yap (örn. admin@acme.com).",
    email: "E-posta",
    password: "Şifre",
    submit: "Giriş yap",
    submitting: "Giriş yapılıyor…",
    invalid: "E-posta veya şifre hatalı",
  },
  processes: {
    title: "Süreç haritası",
    newProcess: "Yeni süreç",
    empty: "Henüz süreç yok — ilkini oluştur.",
    loadFailed: "Süreçler yüklenemedi",
    notFound: "Süreç bulunamadı",
    owner: "Sahip",
    purpose: "Amaç",
    publish: "Yayınla",
    republish: "Yeniden yayınla",
    archive: "Arşivle",
    editTitle: "Süreci düzenle",
    newTitle: "Yeni süreç",
    name: "Ad",
    code: "Kod",
    parent: "Üst süreç",
    noParent: "— yok (kök süreç) —",
    createSubmit: "Süreç oluştur",
    saveSubmit: "Değişiklikleri kaydet",
    saveFailed: "Kaydetme başarısız",
    parentsLoadFailed: "Üst süreç listesi yüklenemedi",
    sipoc: {
      suppliers: "Tedarikçiler",
      inputs: "Girdiler",
      steps: "Süreç adımları",
      outputs: "Çıktılar",
      customers: "Müşteriler",
    },
  },
  kpis: {
    title: "KPI panosu",
    newKpi: "Yeni KPI",
    empty: "Henüz KPI yok — bir şablondan oluştur.",
    loadFailed: "KPI'lar yüklenemedi",
    notFound: "KPI bulunamadı",
    noMeasurements: "Henüz ölçüm yok.",
    addMeasurement: "Ölçüm ekle",
    period: "Dönem",
    value: "Değer",
    note: "Not",
    history: "Geçmiş",
    overwriteHint: "Var olan bir dönemi tekrar girmek değerin üzerine yazar.",
    invalidMeasurement: "Geçersiz ölçüm — dönemi ve değeri kontrol et",
    higherIsBetter: "yüksek olması iyi",
    lowerIsBetter: "düşük olması iyi",
    newTitle: "Yeni KPI",
    fromTemplate: "Bir şablondan başla",
    templatesLoadFailed: "Şablonlar yüklenemedi",
    name: "Ad",
    unit: "Birim",
    unitPlaceholder: "%, saat, adet…",
    direction: "Yön",
    directionHigher: "Yüksek olması iyi",
    directionLower: "Düşük olması iyi",
    frequency: "Sıklık",
    targetLabel: "Hedef (opsiyonel)",
    tolerance: "Tolerans % (sarı bant)",
    linkedProcess: "Bağlı süreç (opsiyonel)",
    noProcess: "— yok —",
    description: "Açıklama",
    createSubmit: "KPI oluştur",
    saveFailed: "Kaydetme başarısız",
  },
} as const;

export const processStatusLabels: Record<ProcessStatus, string> = {
  draft: "taslak",
  published: "yayında",
  archived: "arşiv",
};

export const kpiStatusLabels: Record<KpiStatus, string> = {
  green: "hedefte",
  yellow: "tolerans bandında",
  red: "hedef dışında",
  gray: "veri yok",
};

export const frequencyLabels: Record<"daily" | "weekly" | "monthly", string> = {
  daily: "günlük",
  weekly: "haftalık",
  monthly: "aylık",
};
