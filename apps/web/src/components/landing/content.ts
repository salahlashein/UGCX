import type { Locale } from '../../i18n/types';

/**
 * Public landing page content. It lives here, not in i18n/en.json and
 * ar.json, because the landing page is a marketing page with long lists
 * (steps, questions, table rows). The parity test in
 * __tests__/landingContent.test.ts keeps the two languages the same shape.
 */

/** Brand names shown in the logo row. Add a brand only after it agrees in writing. */
export const FOUNDING_BRAND_LOGOS: readonly string[] = [];

/** Number of places in the founding brands offer. */
export const FOUNDING_BRAND_SPOTS = 20;

/** Platform fee rate shown on the page. Keep it equal to PLATFORM_FEE_RATE in the API. */
export const PLATFORM_FEE_PERCENT = 10;

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingQuestion {
  q: string;
  a: string;
}

export interface LandingCopy {
  nav: {
    how: string;
    creators: string;
    pricing: string;
    faq: string;
    login: string;
    language: string;
  };
  cta: { postBrief: string; joinCreator: string };
  hero: {
    badge: string;
    title: string;
    lead: string;
    receiptTitle: string;
    receiptStamp: string;
    lineFunded: string;
    lineReleased: string;
    lineAllocated: string;
    available: string;
    receiptNote: string;
  };
  proof: { logosTitle: string; facts: { value: string; label: string }[] };
  how: {
    overline: string;
    title: string;
    tabBrands: string;
    tabCreators: string;
    brands: LandingStep[];
    creators: LandingStep[];
    previewOverline: string;
    previewTitle: string;
    previewStatus: string;
    previewShips: string;
    previewBody: string;
    previewBudget: string;
    previewBudgetValue: string;
  };
  reel: { title: string; lead: string; items: { niche: string; format: string }[]; note: string };
  compare: {
    title: string;
    columns: [string, string, string, string];
    rows: [string, string, string, string][];
  };
  creators: {
    badge: string;
    title: string;
    lead: string;
    statementTitle: string;
    rows: { label: string; dir: 'in' | 'out'; amount: string }[];
    inLabel: string;
    outLabel: string;
    available: string;
    availableValue: string;
    payouts: string;
  };
  pricing: {
    title: string;
    lead: string;
    overline: string;
    badge: string;
    feeLabel: string;
    points: string[];
  };
  founding: { overline: string; title: string; body: string; cta: string };
  faq: {
    title: string;
    tabs: { brands: string; creators: string; payments: string };
    brands: LandingQuestion[];
    creators: LandingQuestion[];
    payments: LandingQuestion[];
  };
  final: { title: string; lead: string };
  footer: { rights: string };
}

const en: LandingCopy = {
  nav: {
    how: 'How it works',
    creators: 'For creators',
    pricing: 'Pricing',
    faq: 'FAQ',
    login: 'Log in',
    language: 'عربي',
  },
  cta: { postBrief: 'Post a brief', joinCreator: 'Join as a creator' },
  hero: {
    badge: 'Escrow on every video',
    title: 'Your money waits. The creator films. You approve, then they get paid.',
    lead: 'ReelPal is the UGC marketplace for Egypt. Post a brief, hire vetted creators, and never pay for a video you do not like.',
    receiptTitle: 'Example brief · Summer serum launch',
    receiptStamp: 'Held',
    lineFunded: '3 videos × EGP 1,500',
    lineReleased: 'Released · video 1 approved',
    lineAllocated: 'Allocated · 2 in progress',
    available: 'Available',
    receiptNote: 'Money moves only when you press Approve.',
  },
  proof: {
    logosTitle: 'Founding brands',
    facts: [
      { value: '24h', label: 'to check a new creator' },
      { value: 'EGP 0', label: 'paid out before you approve' },
      { value: '2', label: 'revisions in every brief' },
      { value: 'AR · EN', label: 'briefs, chat and videos' },
    ],
  },
  how: {
    overline: 'How it works',
    title: 'How ReelPal works',
    tabBrands: 'For brands',
    tabCreators: 'For creators',
    brands: [
      { title: 'Post a brief', body: 'Say what to film and what to avoid. Arabic or English.' },
      { title: 'Fund the brief', body: 'Pay once by card. The money stays in escrow.' },
      { title: 'Accept proposals', body: 'Each price comes out of the brief balance.' },
      { title: 'Review the video', body: 'Approve it or ask for a change.' },
      { title: 'Done', body: 'The creator gets paid. You keep the rights.' },
    ],
    creators: [
      { title: 'Make your profile', body: 'Add your niche, city and sample videos.' },
      { title: 'Get checked', body: 'A person reviews your profile, most within 24 hours.' },
      { title: 'Apply to briefs', body: 'Send a proposal with your own price.' },
      { title: 'Film and upload', body: 'Upload the video in the app. Fix it if the brand asks.' },
      { title: 'Get paid', body: 'The brand approves, then ReelPal pays you.' },
    ],
    previewOverline: 'Brief preview',
    previewTitle: 'Summer serum · 3 videos',
    previewStatus: 'Open',
    previewShips: 'Ships product',
    previewBody: 'Show the texture on skin. Say it absorbs fast. Do not compare with other brands.',
    previewBudget: 'Budget per video',
    previewBudgetValue: 'EGP 1,200 – 1,800',
  },
  reel: {
    title: 'Real people. Real Egyptian accents.',
    lead: 'Unboxings, reviews, how-tos and ads for Meta and TikTok.',
    items: [
      { niche: 'Skincare', format: 'Routine' },
      { niche: 'Fashion', format: 'Try-on' },
      { niche: 'Food', format: 'Taste test' },
      { niche: 'Home', format: 'Before / after' },
      { niche: 'Apps', format: 'Screen + face' },
      { niche: 'Mother & baby', format: 'Review' },
      { niche: 'Pets', format: 'Unboxing' },
      { niche: 'Electronics', format: 'How-to' },
    ],
    note: 'Examples of video formats. Real creator videos come next.',
  },
  compare: {
    title: 'Why not just DM a creator?',
    columns: ['', 'Instagram DMs', 'Agency', 'ReelPal'],
    rows: [
      ['When you pay', 'Before filming', 'Up front', 'After you approve'],
      [
        'If the video is not right',
        'Money lost',
        'Long back and forth',
        '2 revisions, then ReelPal reviews it',
      ],
      ['Creator checked', 'No', 'Yes', 'Yes, by a person'],
      ['Usage rights', 'Not clear', 'In a contract', 'In every job'],
      [
        'Where your money is',
        'With the creator',
        'With the agency',
        'In escrow, shown in your balance',
      ],
    ],
  },
  creators: {
    badge: 'For creators',
    title: 'Get paid to film. No follower minimum.',
    lead: 'Pick briefs that fit you and set your own price. The brand pays before you film, so you know the money is there.',
    statementTitle: 'Example earnings',
    rows: [
      { label: 'Skincare brand · serum video', dir: 'in', amount: '1,500.00' },
      { label: 'Fashion brand · unboxing', dir: 'in', amount: '900.00' },
      { label: 'Payout · InstaPay', dir: 'out', amount: '-2,000.00' },
    ],
    inLabel: 'In',
    outLabel: 'Out',
    available: 'Available',
    availableValue: 'EGP 400.00',
    payouts: 'Payouts by InstaPay, mobile wallet or bank transfer. You keep your full price.',
  },
  pricing: {
    title: 'One simple price',
    lead: 'No subscription. No monthly fee.',
    overline: 'Per video',
    badge: 'Pay as you go',
    feeLabel: 'ReelPal fee on top of the creator price',
    points: [
      'Creators set their own price in EGP',
      'Price and fee stay in escrow until you approve',
      '2 revisions in every brief',
      'Close a brief and get the unused balance back',
    ],
  },
  founding: {
    overline: 'Founding brands',
    title: 'Be one of our first {{spots}} brands',
    body: 'We help you write your first brief and pick your first creators.',
    cta: 'Apply as a founding brand',
  },
  faq: {
    title: 'Questions',
    tabs: { brands: 'Brands', creators: 'Creators', payments: 'Payments' },
    brands: [
      {
        q: 'How long does a video take?',
        a: 'Most briefs get proposals within 48 hours. The creator has the delivery time you set in the brief. If they need your product, the clock starts when it arrives.',
      },
      {
        q: 'Can I talk to the creator first?',
        a: 'Yes. Each job has a chat in the app. You can ask questions before and after you accept.',
      },
      {
        q: 'What if I do not like the video?',
        a: 'Ask for a change. Every brief includes 2 revisions. If it still does not fit, ReelPal reviews the job.',
      },
      {
        q: 'Can my team approve videos?',
        a: 'Yes. Add team members as owner, approver or viewer.',
      },
    ],
    creators: [
      { q: 'Do I need many followers?', a: 'No. Brands pay for the video, not for your audience.' },
      {
        q: 'How do you check creators?',
        a: 'A person reviews your profile and sample videos. Most reviews finish within 24 hours.',
      },
      { q: 'Who sets the price?', a: 'You do. Send your price with each proposal.' },
    ],
    payments: [
      {
        q: 'Where is my money before I approve?',
        a: 'ReelPal holds it in escrow against your brief. Your balance shows what is funded, allocated, released and available.',
      },
      {
        q: 'When does the creator get paid?',
        a: 'After you approve the video. ReelPal then pays the creator by InstaPay, mobile wallet or bank transfer.',
      },
      {
        q: 'Can I get my money back?',
        a: 'Yes. Close the brief and the available balance comes back to you.',
      },
    ],
  },
  final: {
    title: 'Your next ad is one brief away',
    lead: 'Post it today. Get proposals within 48 hours.',
  },
  footer: { rights: '© 2026 ReelPal' },
};

const ar: LandingCopy = {
  nav: {
    how: 'طريقة العمل',
    creators: 'لصناع المحتوى',
    pricing: 'الأسعار',
    faq: 'الأسئلة الشائعة',
    login: 'تسجيل الدخول',
    language: 'English',
  },
  cta: { postBrief: 'انشر طلب فيديو', joinCreator: 'انضم كصانع محتوى' },
  hero: {
    badge: 'ضمان مالي على كل فيديو',
    title: 'فلوسك محفوظة. صانع المحتوى يصوّر. توافق أنت، وبعدها يستلم أجره.',
    lead: 'ReelPal هي منصة محتوى المستخدمين (UGC) في مصر. انشر طلبك، واختر صناع محتوى موثقين، ولا تدفع أبدًا مقابل فيديو لا يعجبك.',
    receiptTitle: 'مثال · إطلاق سيروم الصيف',
    receiptStamp: 'محجوز',
    lineFunded: '٣ فيديوهات × ١٬٥٠٠ جنيه',
    lineReleased: 'تم الصرف · الفيديو ١ معتمد',
    lineAllocated: 'مخصص · ٢ قيد التنفيذ',
    available: 'المتاح',
    receiptNote: 'لا تتحرك الفلوس إلا عندما تضغط "اعتماد".',
  },
  proof: {
    logosTitle: 'العلامات التجارية المؤسسة',
    facts: [
      { value: '24h', label: 'لمراجعة صانع محتوى جديد' },
      { value: 'EGP 0', label: 'تُصرف قبل موافقتك' },
      { value: '2', label: 'تعديلات في كل طلب' },
      { value: 'AR · EN', label: 'الطلبات والمحادثات والفيديوهات' },
    ],
  },
  how: {
    overline: 'طريقة العمل',
    title: 'كيف تعمل ReelPal',
    tabBrands: 'للعلامات التجارية',
    tabCreators: 'لصناع المحتوى',
    brands: [
      {
        title: 'انشر طلب الفيديو',
        body: 'اكتب ما تريد تصويره وما يجب تجنبه، بالعربي أو الإنجليزي.',
      },
      { title: 'موّل الطلب', body: 'ادفع مرة واحدة بالبطاقة. تبقى الفلوس في الضمان.' },
      { title: 'اقبل العروض', body: 'يُخصم سعر كل عرض من رصيد الطلب.' },
      { title: 'راجع الفيديو', body: 'اعتمده أو اطلب تعديلًا.' },
      { title: 'تم', body: 'يستلم صانع المحتوى أجره، وتحتفظ أنت بحقوق الاستخدام.' },
    ],
    creators: [
      { title: 'أنشئ ملفك', body: 'أضف مجالك ومدينتك وفيديوهات من أعمالك.' },
      { title: 'المراجعة', body: 'يراجع شخص من فريقنا ملفك، وغالبًا خلال ٢٤ ساعة.' },
      { title: 'قدّم على الطلبات', body: 'أرسل عرضك بالسعر الذي تحدده.' },
      { title: 'صوّر وارفع', body: 'ارفع الفيديو من التطبيق، وعدّله إذا طلبت العلامة التجارية.' },
      { title: 'استلم أجرك', body: 'تعتمد العلامة التجارية الفيديو، ثم تدفع لك ReelPal.' },
    ],
    previewOverline: 'معاينة الطلب',
    previewTitle: 'سيروم الصيف · ٣ فيديوهات',
    previewStatus: 'مفتوح',
    previewShips: 'يتم شحن المنتج',
    previewBody: 'اعرض قوام المنتج على البشرة. قل إنه يُمتص بسرعة. لا تقارنه بعلامات أخرى.',
    previewBudget: 'الميزانية لكل فيديو',
    previewBudgetValue: '١٬٢٠٠ – ١٬٨٠٠ جنيه',
  },
  reel: {
    title: 'ناس حقيقيون. لهجة مصرية حقيقية.',
    lead: 'فتح منتجات، تقييمات، شروحات، وإعلانات لميتا وتيك توك.',
    items: [
      { niche: 'العناية بالبشرة', format: 'روتين' },
      { niche: 'الأزياء', format: 'تجربة ملابس' },
      { niche: 'الطعام', format: 'تجربة تذوق' },
      { niche: 'المنزل', format: 'قبل / بعد' },
      { niche: 'التطبيقات', format: 'شاشة + وجه' },
      { niche: 'الأم والطفل', format: 'تقييم' },
      { niche: 'الحيوانات الأليفة', format: 'فتح منتج' },
      { niche: 'الإلكترونيات', format: 'شرح' },
    ],
    note: 'أمثلة على أنواع الفيديو. فيديوهات صناع المحتوى الحقيقية قريبًا.',
  },
  compare: {
    title: 'لماذا لا تراسل صانع المحتوى مباشرة؟',
    columns: ['', 'رسائل إنستجرام', 'وكالة', 'ReelPal'],
    rows: [
      ['متى تدفع', 'قبل التصوير', 'مقدمًا', 'بعد موافقتك'],
      ['إذا لم يناسبك الفيديو', 'تخسر فلوسك', 'نقاش طويل', 'تعديلان، ثم تراجع ReelPal المهمة'],
      ['مراجعة صانع المحتوى', 'لا', 'نعم', 'نعم، بواسطة شخص'],
      ['حقوق الاستخدام', 'غير واضحة', 'في عقد', 'في كل مهمة'],
      ['أين فلوسك', 'مع صانع المحتوى', 'مع الوكالة', 'في الضمان، وتظهر في رصيدك'],
    ],
  },
  creators: {
    badge: 'لصناع المحتوى',
    title: 'اكسب من التصوير. بدون حد أدنى للمتابعين.',
    lead: 'اختر الطلبات التي تناسبك وحدد سعرك. العلامة التجارية تدفع قبل أن تصوّر، فتعرف أن الفلوس موجودة.',
    statementTitle: 'مثال على الأرباح',
    rows: [
      { label: 'علامة عناية بالبشرة · فيديو سيروم', dir: 'in', amount: '1,500.00' },
      { label: 'علامة أزياء · فتح منتج', dir: 'in', amount: '900.00' },
      { label: 'سحب · إنستاباي', dir: 'out', amount: '-2,000.00' },
    ],
    inLabel: 'وارد',
    outLabel: 'صادر',
    available: 'المتاح',
    availableValue: 'EGP 400.00',
    payouts: 'السحب عبر إنستاباي أو المحفظة الإلكترونية أو التحويل البنكي. تستلم سعرك كاملًا.',
  },
  pricing: {
    title: 'سعر واحد بسيط',
    lead: 'بدون اشتراك. بدون رسوم شهرية.',
    overline: 'لكل فيديو',
    badge: 'ادفع حسب الاستخدام',
    feeLabel: 'رسوم ReelPal فوق سعر صانع المحتوى',
    points: [
      'يحدد صناع المحتوى أسعارهم بالجنيه',
      'يبقى السعر والرسوم في الضمان حتى توافق',
      'تعديلان في كل طلب',
      'أغلق الطلب واسترد الرصيد غير المستخدم',
    ],
  },
  founding: {
    overline: 'العلامات التجارية المؤسسة',
    title: 'كن من أول {{spots}} علامة تجارية',
    body: 'نساعدك في كتابة أول طلب واختيار أول صناع محتوى.',
    cta: 'قدّم كعلامة تجارية مؤسسة',
  },
  faq: {
    title: 'الأسئلة الشائعة',
    tabs: { brands: 'العلامات التجارية', creators: 'صناع المحتوى', payments: 'المدفوعات' },
    brands: [
      {
        q: 'كم يستغرق الفيديو؟',
        a: 'تصل العروض لمعظم الطلبات خلال ٤٨ ساعة. يلتزم صانع المحتوى بمدة التسليم التي تحددها. إذا احتاج المنتج، تبدأ المدة عند وصوله.',
      },
      {
        q: 'هل أستطيع التحدث مع صانع المحتوى أولًا؟',
        a: 'نعم. لكل مهمة محادثة داخل التطبيق، قبل القبول وبعده.',
      },
      {
        q: 'ماذا لو لم يعجبني الفيديو؟',
        a: 'اطلب تعديلًا. كل طلب يشمل تعديلين. إذا لم يناسبك بعدها، تراجع ReelPal المهمة.',
      },
      {
        q: 'هل يستطيع فريقي اعتماد الفيديوهات؟',
        a: 'نعم. أضف أعضاء الفريق كمالك أو معتمِد أو مشاهد.',
      },
    ],
    creators: [
      {
        q: 'هل أحتاج عددًا كبيرًا من المتابعين؟',
        a: 'لا. العلامات التجارية تدفع مقابل الفيديو، وليس مقابل جمهورك.',
      },
      {
        q: 'كيف تراجعون صناع المحتوى؟',
        a: 'يراجع شخص من فريقنا ملفك وفيديوهاتك. تنتهي معظم المراجعات خلال ٢٤ ساعة.',
      },
      { q: 'من يحدد السعر؟', a: 'أنت. أرسل سعرك مع كل عرض.' },
    ],
    payments: [
      {
        q: 'أين فلوسي قبل أن أوافق؟',
        a: 'تحتفظ بها ReelPal في الضمان مقابل طلبك. يعرض رصيدك المبالغ الممولة والمخصصة والمصروفة والمتاحة.',
      },
      {
        q: 'متى يستلم صانع المحتوى أجره؟',
        a: 'بعد اعتمادك للفيديو. ثم تدفع ReelPal له عبر إنستاباي أو المحفظة أو التحويل البنكي.',
      },
      { q: 'هل أستطيع استرداد فلوسي؟', a: 'نعم. أغلق الطلب ويعود إليك الرصيد المتاح.' },
    ],
  },
  final: {
    title: 'إعلانك القادم على بعد طلب واحد',
    lead: 'انشره اليوم واستقبل العروض خلال ٤٨ ساعة.',
  },
  footer: { rights: '© 2026 ReelPal' },
};

export const landingCopy: Record<Locale, LandingCopy> = { en, ar };
