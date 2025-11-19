// Direct translation objects to avoid JSON import issues
export const translations = {
  en: {
    common: {
      loading: "Loading...",
      credits: "Credits",
      copy: "Copy",
      copied: "Copied!",
      delete: "Delete",
      areYouSure: "Are you sure?",
      actionCannotBeUndone: "This action cannot be undone.",
      deleteConfirm: "Yes, delete it",
      optional: "Optional"
    },
    header: {
      marketplace: "Marketplace",
      partner: "Partner With Us",
      affiliate: "Affiliate Network",
      dashboard: "Dashboard",
      logout: "Logout",
      loginSignup: "Login / Signup"
    },
    home: {
      hero: {
        title: "The B2B Referral Economy, Reimagined.",
        subtitle: "Create powerful coupon campaigns and grow your business network through our partner-driven credit system.",
        badge: "Trusted by growth teams worldwide",
        primaryCta: "Launch Your Campaign",
        secondaryCta: "Explore Marketplace"
      },
      generator: {
        title: "Generate a Coupon Now",
        placeholder1: "Your Shop Name",
        placeholder2: "Your Email",
        button: "Get Started & Create Coupon"
      },
      metrics: {
        shops: "Verified shops",
        coupons: "Coupons launched",
        redemptions: "Successful redemptions"
      },
      benefits: {
        title: "Why CodeCraft",
        description: "Everything you need to launch, measure, and scale B2B coupon partnerships from one dashboard.",
        items: [
          {
            title: "Launch in minutes",
            description: "Craft multi-language coupon experiences with built-in referral tracking and QR-ready sharing."
          },
          {
            title: "Reward your network",
            description: "Automate affiliate commissions and referrer bonuses without spreadsheets or manual payouts."
          },
          {
            title: "Grow together",
            description: "Scale through partner referrals with automated credit allocation and performance insights."
          }
        ]
      },
      howItWorks: {
        title: "How It Works",
        step1: {
          title: "Create Your Campaign",
          description: "Set up your coupon campaign with custom terms, rewards, and targeting options in minutes."
        },
        step2: {
          title: "Share with Partners",
          description: "Distribute your campaigns through our affiliate network and partner ecosystem for maximum reach."
        },
        step3: {
          title: "Track & Optimize",
          description: "Monitor performance in real-time and optimize your campaigns based on detailed analytics."
        }
      },
      workflow: {
        title: "Simple B2B Workflow",
        description: "From creation to conversion, our platform handles the entire coupon lifecycle seamlessly."
      },
      ctaSection: {
        highlight: "Ready to grow?",
        title: "Start Your Campaign Today",
        subtitle: "Join thousands of businesses already growing through strategic partnerships",
        primary: "Get Started Free",
        secondary: "Book a Demo"
      }
    },
    loginPage: {
      title: "Join CodeCraft",
      subtitle: "Access your dashboard or create a new account",
      toggleToSignup: "Need an account? Sign up",
      toggleToLogin: "Already have an account? Sign in",
      emailLabel: "Email",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      shopNameLabel: "Shop Name",
      categoryLabel: "Business Category",
      countryLabel: "Country",
      cityLabel: "City",
      roleLabel: "Account Type",
      loginButton: "Sign In",
      signupButton: "Create Account",
      processing: "Processing...",
      referred: "You were referred by: {{referrer}}",
      dontHaveAccount: "Don't have an account?",
      signUp: "Sign up",
      welcomeBack: "Welcome back"
    },
    welcomeBack: "Welcome back",
    Email: "Email",
    Password: "Password",
    "Sign In": "Sign In",
    dashboard: {
      welcome: "Welcome back",
      yourCredits: "Your Credits",
      totalCoupons: "Total Coupons",
      pendingRedemptions: "Pending Redemptions",
      createCoupon: "Create New Coupon",
      manageCoupons: "Manage Coupons",
      viewAnalytics: "View Analytics"
    },
    couponForm: {
      title: "Create New Coupon",
      offerTitleLabel: "Offer Title",
      offerDescLabel: "Offer Description",
      discountLabel: "Discount Amount",
      usageLimitLabel: "Usage Limit",
      affiliateCommissionLabel: "Affiliate Commission",
      customerRewardLabel: "Customer Reward Points",
      createButton: "Create Coupon",
      updating: "Updating...",
      creating: "Creating..."
    },
    validationPortal: {
      title: "Coupon Validation",
      validCoupon: "Valid Coupon Found",
      invalidCoupon: "Invalid or Expired Coupon",
      alreadyRedeemed: "You have already redeemed this coupon",
      redeemButton: "Redeem Now",
      usesLeft: "Uses Left",
      processing: "Processing redemption...",
      success: "Coupon redeemed successfully!",
      error: "Failed to redeem coupon",
      errors: {
        mustBeLoggedIn: "You must be logged in to redeem coupons"
      }
    },
    marketplace: {
      title: "Marketplace",
      subtitle: "Discover amazing deals from our verified partners",
      searchPlaceholder: "Search coupons...",
      allCategories: "All Categories",
      noResults: "No coupons found matching your criteria"
    },
    profile: {
      title: "Profile Settings",
      personalInfo: "Personal Information",
      shopSettings: "Shop Settings",
      saveButton: "Save Changes",
      saving: "Saving..."
    },
    affiliate: {
      dashboardTitle: "Affiliate Dashboard",
      stats: {
        totalPoints: "Total Points Earned",
        totalExecutions: "Total Redemptions"
      },
      availableCoupons: "Available Coupons to Promote",
      getLink: "Get Link"
    },
    admin: {
      dashboardTitle: "Admin Dashboard",
      stats: {
        totalUsers: "Total Users",
        totalCoupons: "Total Coupons",
        creditsDistributed: "Credits Distributed",
        referrerBonuses: "Referrer Bonuses"
      },
      tables: {
        allUsers: {
          title: "All Users",
          name: "Name",
          email: "Email",
          roles: "Roles",
          credits: "Credits",
          actions: "Actions"
        },
        allCoupons: {
          title: "All Coupons",
          shopOwner: "Shop Owner",
          usesLeft: "Uses Left",
          actions: "Actions"
        },
        creditLog: {
          title: "Credit Allocation Log",
          date: "Date",
          shopName: "Shop Name",
          type: "Type",
          amount: "Amount"
        }
      }
    },
    roles: {
      admin: "Admin",
      "shop-owner": "Shop Owner",
      affiliate: "Affiliate",
      user: "User"
    },
    referralStatus: {
      pending: "Pending",
      rewarded: "Rewarded"
    },
    partnerPage: {
      hero: {
        title: "Partner With CodeCraft",
        subtitle: "Join our network and unlock new revenue streams through strategic partnerships"
      },
      benefits: {
        title: "Partnership Benefits",
        description: "Grow your business with our comprehensive partnership program"
      },
      whyJoin: {
        title: "Why Join?",
        description: "Earn credits and unlock rewards by bringing new shops into our ecosystem. We provide the tools, you drive the growth."
      },
      ctaButton: "Start Earning Now"
    },
    legal: {
      title: "Legal Information",
      terms: {
        title: "Terms of Service",
        description: "By using our platform, you agree to our terms and conditions. Please read carefully."
      },
      privacy: {
        title: "Privacy Policy",
        description: "We respect your privacy and are committed to protecting your personal data."
      },
      cookies: {
        title: "Cookie Policy",
        description: "We use cookies to enhance your experience, analyze site traffic, and for marketing purposes."
      }
    },
    cookies: {
      bannerText: "We use cookies to enhance your experience.",
      learnMore: "Learn More",
      decline: "Decline",
      accept: "Accept"
    },
    notFound: {
      title: "Page Not Found",
      description: "Sorry, the page you are looking for does not exist.",
      goHome: "Go Back to Home"
    },
    qrCodeModal: {
      title: "Share this QR Code or Link"
    },
    CodeCraft: "CodeCraft",
    English: "English"
  },
  ar: {
    common: {
      loading: "جاري التحميل...",
      credits: "الرصيد",
      copy: "نسخ",
      copied: "تم النسخ!",
      delete: "حذف",
      areYouSure: "هل أنت متأكد؟",
      actionCannotBeUndone: "لا يمكن التراجع عن هذا الإجراء.",
      deleteConfirm: "نعم، احذف",
      optional: "اختياري"
    },
    header: {
      marketplace: "السوق",
      partner: "شراكة معنا",
      affiliate: "شبكة التسويق",
      dashboard: "لوحة التحكم",
      logout: "تسجيل خروج",
      loginSignup: "دخول / تسجيل"
    },
    home: {
      hero: {
        title: "اقتصاد الإحالة B2B، معاد تصميمه.",
        subtitle: "أنشئ حملات قسائم قوية وطور شبكة أعمالك من خلال نظام الائتمان المدفوع بالشراكة.",
        badge: "موثوق من قبل فرق النمو في جميع أنحاء العالم",
        primaryCta: "ابدأ حملتك",
        secondaryCta: "استكشف السوق"
      },
      generator: {
        title: "أنشئ قسيمة الآن",
        placeholder1: "اسم متجرك",
        placeholder2: "بريدك الإلكتروني",
        button: "ابدأ وأنشئ قسيمة"
      },
      metrics: {
        shops: "متاجر معتمدة",
        coupons: "قسائم مطلقة",
        redemptions: "استردادات ناجحة"
      },
      benefits: {
        title: "لماذا CodeCraft",
        description: "كل ما تحتاجه لإطلاق وقياس وتوسيع شراكات القسائم B2B من لوحة تحكم واحدة.",
        items: [
          {
            title: "إطلاق في دقائق",
            description: "صمم تجارب قسائم متعددة اللغات مع تتبع الإحالة المدمج والمشاركة الجاهزة للـ QR."
          },
          {
            title: "كافئ شبكتك", 
            description: "أتمت عمولات الشركاء التابعين ومكافآت المُحيلين بدون جداول بيانات أو دفعات يدوية."
          },
          {
            title: "انموا معًا",
            description: "توسع من خلال إحالات الشركاء مع تخصيص الائتمان التلقائي ورؤى الأداء."
          }
        ]
      },
      howItWorks: {
        title: "كيف يعمل",
        step1: {
          title: "أنشئ حملتك",
          description: "قم بإعداد حملة القسائم الخاصة بك مع شروط وجوائز وخيارات استهداف مخصصة في دقائق."
        },
        step2: {
          title: "شارك مع الشركاء",
          description: "وزع حملاتك من خلال شبكة التسويق التابع ونظام الشركاء للوصول الأقصى."
        },
        step3: {
          title: "تتبع وحسن",
          description: "راقب الأداء في الوقت الفعلي وحسن حملاتك بناءً على التحليلات التفصيلية."
        }
      },
      workflow: {
        title: "سير عمل B2B بسيط",
        description: "من الإنشاء إلى التحويل، منصتنا تتعامل مع دورة حياة القسيمة بأكملها بسلاسة."
      },
      ctaSection: {
        highlight: "مستعد للنمو؟",
        title: "ابدأ حملتك اليوم",
        subtitle: "انضم إلى الآلاف من الشركات التي تنمو بالفعل من خلال الشراكات الاستراتيجية",
        primary: "ابدأ مجاناً",
        secondary: "احجز عرضاً توضيحياً"
      }
    },
    loginPage: {
      title: "انضم إلى CodeCraft",
      subtitle: "ادخل إلى لوحة التحكم أو أنشئ حساب جديد",
      toggleToSignup: "تحتاج حساب؟ سجل",
      toggleToLogin: "لديك حساب بالفعل؟ سجل دخول",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      nameLabel: "الاسم الكامل",
      shopNameLabel: "اسم المتجر",
      categoryLabel: "فئة العمل",
      countryLabel: "البلد",
      cityLabel: "المدينة",
      roleLabel: "نوع الحساب",
      loginButton: "تسجيل دخول",
      signupButton: "إنشاء حساب",
      processing: "جاري المعالجة...",
      referred: "تم إحالتك من قبل: {{referrer}}"
    },
    dashboard: {
      welcome: "مرحبًا بعودتك",
      yourCredits: "رصيدك",
      totalCoupons: "إجمالي القسائم",
      pendingRedemptions: "الاستردادات المعلقة",
      createCoupon: "إنشاء قسيمة جديدة",
      manageCoupons: "إدارة القسائم",
      viewAnalytics: "عرض التحليلات"
    },
    couponForm: {
      title: "إنشاء قسيمة جديدة",
      offerTitleLabel: "عنوان العرض",
      offerDescLabel: "وصف العرض",
      discountLabel: "مبلغ الخصم",
      usageLimitLabel: "حد الاستخدام",
      affiliateCommissionLabel: "عمولة الشريك التابع",
      customerRewardLabel: "نقاط مكافأة العميل",
      createButton: "إنشاء قسيمة",
      updating: "جاري التحديث...",
      creating: "جاري الإنشاء..."
    },
    validationPortal: {
      title: "تحقق من القسيمة",
      validCoupon: "تم العثور على قسيمة صالحة",
      invalidCoupon: "قسيمة غير صالحة أو منتهية الصلاحية",
      alreadyRedeemed: "لقد استردت هذه القسيمة بالفعل",
      redeemButton: "استرد الآن",
      usesLeft: "الاستخدامات المتبقية",
      processing: "جاري معالجة الاسترداد...",
      success: "تم استرداد القسيمة بنجاح!",
      error: "فشل في استرداد القسيمة",
      errors: {
        mustBeLoggedIn: "يجب أن تكون مسجل دخول لاسترداد القسائم"
      }
    },
    marketplace: {
      title: "السوق",
      subtitle: "اكتشف عروض مذهلة من شركائنا المعتمدين",
      searchPlaceholder: "البحث في القسائم...",
      allCategories: "جميع الفئات",
      noResults: "لم يتم العثور على قسائم تطابق معاييرك"
    },
    profile: {
      title: "إعدادات الملف الشخصي",
      personalInfo: "المعلومات الشخصية",
      shopSettings: "إعدادات المتجر",
      saveButton: "حفظ التغييرات",
      saving: "جاري الحفظ..."
    },
    affiliate: {
      dashboardTitle: "لوحة تحكم الشريك التابع",
      stats: {
        totalPoints: "إجمالي النقاط المكتسبة",
        totalExecutions: "إجمالي الاستردادات"
      },
      availableCoupons: "القسائم المتاحة للترويج",
      getLink: "احصل على الرابط"
    },
    admin: {
      dashboardTitle: "لوحة تحكم الإدارة",
      stats: {
        totalUsers: "إجمالي المستخدمين",
        totalCoupons: "إجمالي القسائم",
        creditsDistributed: "الائتمانات الموزعة",
        referrerBonuses: "مكافآت المُحيلين"
      },
      tables: {
        allUsers: {
          title: "جميع المستخدمين",
          name: "الاسم",
          email: "البريد الإلكتروني",
          roles: "الأدوار",
          credits: "الائتمانات",
          actions: "الإجراءات"
        },
        allCoupons: {
          title: "جميع القسائم",
          shopOwner: "صاحب المتجر",
          usesLeft: "الاستخدامات المتبقية",
          actions: "الإجراءات"
        },
        creditLog: {
          title: "سجل تخصيص الائتمان",
          date: "التاريخ",
          shopName: "اسم المتجر",
          type: "النوع",
          amount: "المبلغ"
        }
      }
    },
    roles: {
      admin: "مدير",
      "shop-owner": "صاحب متجر",
      affiliate: "شريك تابع",
      user: "مستخدم"
    },
    referralStatus: {
      pending: "معلق",
      rewarded: "مكافأ"
    },
    partnerPage: {
      hero: {
        title: "شراكة مع CodeCraft",
        subtitle: "انضم إلى شبكتنا واكتشف مصادر دخل جديدة من خلال الشراكات الاستراتيجية"
      },
      benefits: {
        title: "فوائد الشراكة",
        description: "طور عملك مع برنامج الشراكة الشامل لدينا"
      },
      whyJoin: {
        title: "لماذا الانضمام؟",
        description: "اكسب ائتمانات واكتشف المكافآت عبر جلب متاجر جديدة إلى نظامنا البيئي. نحن نوفر الأدوات، وأنت تقود النمو."
      },
      ctaButton: "ابدأ الكسب الآن"
    },
    legal: {
      title: "المعلومات القانونية",
      terms: {
        title: "شروط الخدمة",
        description: "باستخدام منصتنا، فإنك توافق على الشروط والأحكام. يرجى القراءة بعناية."
      },
      privacy: {
        title: "سياسة الخصوصية",
        description: "نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية."
      },
      cookies: {
        title: "سياسة ملفات تعريف الارتباط",
        description: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور على الموقع ولأغراض التسويق."
      }
    },
    cookies: {
      bannerText: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك.",
      learnMore: "اعرف المزيد",
      decline: "رفض",
      accept: "قبول"
    },
    notFound: {
      title: "الصفحة غير موجودة",
      description: "عذرًا، الصفحة التي تبحث عنها غير موجودة.",
      goHome: "العودة إلى الصفحة الرئيسية"
    },
    qrCodeModal: {
      title: "شارك رمز QR أو الرابط"
    }
  }
};

export type Language = 'en' | 'ar';
export type Translations = Record<string, any>;