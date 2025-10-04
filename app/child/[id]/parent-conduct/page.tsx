'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// ...existing code...

export default function ParentConductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eid = params?.id as string | undefined; // page context id (existing child route id)
  const studentId = searchParams.get('studentId') || ''; // real student sourcedId if provided


  const [currentStep, setCurrentStep] = React.useState(1);
  // Static data for display
  const formData = {
    educationAuthority: 'الإدارة العامة للتعليم بمنطقة الرياض',
    schoolName: 'مدرسة الملك عبدالعزيز الابتدائية',
    grade: 'الخامس / أ',
    studentName: 'أحمد محمد العلي',
    parentName: 'محمد عبدالله العلي',
    studentId: studentId || '1234567890',
    parentId: '2987654321',
    phone: '0551234567',
    email: 'mohammed.ali@example.com'
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString('ar-SA');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, []);

  const conductTerms = {
    validityPeriod: 'سنة دراسية واحدة تبدأ من تاريخ الإقرار على الميثاق.',
    schoolCommitments: {
      title: 'التزامات المدرسة',
      sections: [
        {
          title: 'المتطلبات الأساسية',
          items: [
            'ضمان بيئة مدرسية قائمة على المساواة وتكافؤ الفرص بين الطلبة كافة.',
            'اطلاع أولياء الأمور على نتائج التقييمات والإجراءات المعتمدة لرفع مستوى أداء أبنائهم.',
            'إبلاغ أولياء الأمور عن سلوكيات أبنائهم الإيجابية، بالإضافة إلى مخالفاتهم السلوكية.',
            'تعريف أولياء أمور الطلبة من فئة أصحاب الهمم بحقوقهم وواجباتهم وتوفير بيئة تعليمية غنية وداعمة ومرافق مجهزة ومعدلة تلائم احتياجاتهم.',
            'ضمان توفير بيئة مدرسية آمنة وشاملة تضمن سلامة الطلبة.',
            'وضع الإرشادات الخاصة بصحة الطلبة وتوعيتهم بأهمية تبني عادات وأنماط الحياة الصحية.',
            'بناء قنوات تواصل فعالة مع أولياء الأمور لإبلاغهم بالمستجدات من التعليمات أو الإجراءات أو اللوائح ومشاركتهم بالمعلومات المهمة بالإضافة إلى اطلاعهم على أخبار المدرسة.',
            'الشفافية والعدالة في تنفيذ الإجراءات والسياسات مع الحفاظ على سرية المعلومات وبيانات الطلبة.'
          ]
        },
        {
          title: 'السلوك والانضباط',
          items: [
            'تطبيق القرار الوزاري رقم (851) لسنة 2018 بشأن لائحة إدارة سلوك الطلبة في مؤسسات التعليم العام الطلبة بعدالة وشفافية، مع توعية الطلبة وأولياء أمورهم بالعواقب المترتبة على المخالفات.',
            'متابعة انتظام الطلبة في الحضور والانصراف وفق المواعيد الرسمية والأدلة الإجرائية، واتخاذ الإجراءات المناسبة عند وجود تأخير أو غياب غير مبرر.',
            'الالتزام باحترام أولياء الأمور، وبناء قنوات تواصل فعّالة معهم لإبلاغهم بالمستجدات المتعلقة بالتعليمات والإجراءات واللوائح، ومشاركتهم بالمعلومات المهمة، وإطلاعهم على أخبار المدرسة بانتظام.'
          ]
        },
        {
          title: 'جودة حياة الطلبة / الصحة والسلامة',
          items: [
            'توفير بيئة مدرسية صحية وآمنة تتوافق مع معايير الامن والسلامة.',
            'تنظيم برامج توعية لتعزيز النظافة الشخصية والصحة العامة للطلبة.',
            'حفظ السجلات الطبية الخاصة بالطلبة والتنسيق مع أولياء الأمور بشأن أي حالات صحية.'
          ]
        },
        {
          title: 'المواطنة الإيجابية والهوية الوطنية',
          items: [
            'تنظيم فعاليات لتعزيز قيم المواطنة الصالحة والمسؤولية الاجتماعية لدى الطلبة.',
            'غرس الاعتزاز بالهوية الوطنية والقيم الإنسانية مثل الاحترام والتسامح والتعايش المشترك من خلال الأنشطة المختلفة.'
          ]
        },
        {
          title: 'التحصيل الدراسي والمناهج والبرامج التعليمية',
          items: [
            'تحديث بيانات الطلبة بشكل دوري في أنظمة الوزارة.',
            'متابعة الأداء الأكاديمي للطلبة بانتظام، وإشراك أولياء الأمور في نتائج التقييمات والإجراءات المعتمدة لرفع مستوى أبنائهم.',
            'إعداد وتنفيذ خطط تربوية فردية للطلبة من أصحاب الهمم بالتعاون مع أسرهم.',
            'الشفافية والعدالة في تنفيذ الإجراءات والسياسات مع الحفاظ على سرية المعلومات وبيانات الطلبة.'
          ]
        },
        {
          title: 'التقييم والامتحانات',
          items: [
            'تطبيق سياسة التقييم المعتمدة والالتزام بالمواعيد الرسمية للتقييمات والامتحانات.',
            'متابعة نتائج الطلبة بشكل مستمر وتقديم التغذية الراجعة.',
            'ضمان جاهزية بيئة الامتحانات وتوفير الأدوات والأجهزة اللازمة.',
            'منع أي ممارسات تتعلق بالغش أو تسريب الأسئلة، واتخاذ الإجراءات الرادعة عند وقوعها.'
          ]
        },
        {
          title: 'الأنشطة والرعاية الطلابية',
          items: [
            'توفير أنشطة صفية ولاصفية متنوعة لاكتشاف وتنمية مهارات الطلبة.',
            'تشجيع الطلبة على المشاركة في المبادرات الوطنية والبرامج التطوعية وخدمة المجتمع.'
          ]
        },
        {
          title: 'المواصلات',
          items: [
            'الإشراف على خدمات النقل المدرسي الخاصة بالمدرسة وضمان الالتزام بمعايير السلامة.',
            'متابعة سلوك الطلبة في الحافلات واتخاذ الإجراءات التربوية عند حدوث مخالفات.'
          ]
        },
        {
          title: 'الزي المدرسي',
          items: [
            'توعية أولياء الأمور بدليل الزي المدرسي وقنوات البيع الرسمية للزي المدرسي الموحد.',
            'متابعة التزام الطلبة بالزي والمظهر اللائق أثناء الدوام المدرسي.'
          ]
        },
        {
          title: 'الممتلكات العامة بالمدرسة',
          items: [
            'تعزيز وعي الطلبة بأهمية المحافظة على الممتلكات العامة والمرافق المدرسية.',
            'مراقبة استخدام الطلبة للمرافق وضمان حمايتها من العبث أو التخريب.',
            'تطبيق الإجراءات المناسبة في حال حدوث أضرار، بالتنسيق مع أولياء الأمور.'
          ]
        }
      ]
    },
    parentCommitments: {
      title: 'التزامات ولي الأمر',
      sections: [
        {
          title: 'السلوك',
          items: [
            'تشجيع أبنائهم على تبني القيم الأخلاقية والتربوية وتعزيز السُّلوك الايجابي لديهم وتحفيزهم على التعلم والالتزام بالقوانين واحترام جميع العاملين في المدرسة.',
            'الاطلاع على لائحة إدارة سلوك الطلبة في مؤسسات التعليم الحكومية الاتحادية المعتمدة، وتوعية وارشاد أبنائهم على ضرورة الالتزام بها والعواقب التي تترتب على مخالفتها.',
            'حث الطلبة على الالتزام بمواعيد الحضور والانصراف والإلمام بالنتائج المترتبة على التأخير وعدم الغياب دون عذر مقبول بالحضور المبكر للمدرسة وفق المواعيد المحددة والإلمام بعواقب الغياب دون عذر مقبول والتي تتضمن رسوب السنة الدراسية وإعادة السنة كاملة.',
            'الالتزام بتعليمات المدرسة عند الحضور لطلب خدمة أو لمناقشة مشكلة أو تسوية أية نزاعات.'
          ]
        },
        {
          title: 'جودة حياة الطلبة / الصحة والسلامة',
          items: [
            'توفير بيئة صحية تشمل معايير الأغذية الصحية، وأصناف الطعام والشراب المسموح بها في المدرسة.',
            'توفير الوقت الكافي للنوم والاسترخاء والراحة النفسية لأبنائهم في بيئة عائلية مستقرة.',
            'التوعية حول النظافة الشخصية للأبناء.',
            'التحفيز على ممارسة الأنشطة البدنية من خلال التحرك واللعب.',
            'تقديم المساعدة والدعم للأبناء في حل المشاكل الشخصية والعاطفية والدراسية.',
            'توفير كافة التقارير الطبية المتعلقة بالطالب وسيرته المرضية لإدارة المدرسة.',
            'المشاركة الفعالة من خلال الإجابة على الاستبانات المرسلة من قبل الوزارة أو المدرسة.'
          ]
        },
        {
          title: 'المواطنة الإيجابية والهوية الوطنية',
          items: [
            'الالتزام بتعزيز المواطنة الصالحة والمسؤولية الاجتماعية لدى الأبناء وتحفيزهم على القيام بالواجبات والمسؤوليات الوطنية، وتشجيعهم على المشاركة الفعالة في الحياة الاجتماعية والأعمال الخيرية والتطوعية.',
            'الالتزام بتحفيز الأبناء على الاعتزاز بهويتهم الوطنية، والتحلّي بالأخلاق والقيم الإنسانية الأساسية كالاحترام والتسامح والتعايش المشترك بين المواطنين والمقيمين.'
          ]
        },
        {
          title: 'التحصيل الدراسي والمناهج والبرامج التعليمية',
          items: [
            'تحديث بيانات الأبناء حسب الإجراءات والشروط والأحكام المعتمدة في الوزارة.',
            'يلتزم ولي الأمر بتوفير جهاز الحاسب الي حسب الاجراءات المواصفات المعتمدة في الوزارة مع الالتزام بالمعايير والشروط الخاصة بسياسة استخدام الحاسوب.',
            'التواصل مع إدارة المدرسة لمتابعة أداء أبنائهم في الدراسة وتقديم الدعم لهم.',
            'تحفيز الأبناء على الدراسة، وتحديد الأهداف الواضحة لهم، وإرشادهم، وإظهار أهمية التعليم في حياتهم المستقبلية.',
            'تهيئة الجو الأسري وتخصيص الوقت الكافي للدراسة والتحضير والاستعداد للامتحانات مع ضمان الوقت الكافي للراحة.',
            'متابعة الطلبة من فئة أصحاب الهمم في أداء واجباتهم حسب الخطة التربوية الفردية المعتمدة.'
          ]
        },
        {
          title: 'التقييم والامتحانات',
          items: [
            'الاطلاع على سياسة التقييم المعتمدة والتقيد بما جاء فيها والالتزام بالمواعيد المحددة بالتقييم والامتحانات.',
            'متابعة التقييمات والامتحانات للأبناء بشكل مستمر لرفع مستوى أدائهم على مدار العام الدراسي.',
            'التأكد من جاهزية الأبناء لأداء الامتحان (إحضار الأدوات اللازمة، شحن جهاز الحاسب الآلي/اللوحي).',
            'توعية الطالب بالالتزام بقواعد ولوائح تأدية الامتحان وعدم الغش أو تسريب أسئلة الامتحانات أو المشاركة فيها بأي شكل من الأشكال.'
          ]
        },
        {
          title: 'الأنشطة والرعاية الطلابية',
          items: [
            'تشجيع الأبناء على المشاركة في الأنشطة الصفية واللّاصفية، والفعّاليات، والمبادرات الوطنيّة والعمل التطوعي والخدمة المجتمعية؛ لاكتساب وصقل المهارات العامة.'
          ]
        },
        {
          title: 'المواصلات',
          items: [
            'الالتزام باتباع جميع شروط السلامة والقواعد السلوكية ومواعيد النقل المدرسي التي اعتمدتها المدرسة.',
            'توجيه الأبناء إلى الالتزام بالسلوك الإيجابي في الحافلات المدرسية.',
            'الالتزام بتسديد قيمة أي تلفيات تسبب بها أبناؤه في الحافلة المدرسية.'
          ]
        },
        {
          title: 'الزي المدرسي',
          items: [
            'الالتزام بارتداء الأبناء الزّيَّ المدرسي الموحد من قبل الوزارة.',
            'التزام الأبناء بالمظهر اللائق والأنيق أثناء الدوام المدرسي.'
          ]
        },
        {
          title: 'الممتلكات العامة بالمدرسة',
          items: [
            'تعليم الأبناء قيمة المحافظة على الممتلكات العامة وأهميتها، وتحفيزهم على المحافظة عليها.',
            'توجيه الأبناء بعدم إلحاق أي أضرار متعمدة أو غير متعمدة بالممتلكات العامة في المدرسة.',
            'التعهد بالتعويض عن الأضرار الناجمة عن العبث بالممتلكات والمرافق التي قد يحدثها الطالب في المدرسة أو وسائل النقل.'
          ]
        }
      ]
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 direction-rtl" dir="rtl">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href={eid ? `/child/${encodeURIComponent(eid)}` : '/dashboard'}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4 ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          الرجوع
        </Link>
        <div className="text-xs text-muted-foreground">
          <span>المرحلة: {currentStep} من 4</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">التقدم</span>
          <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>معلومات المدرسة</span>
          <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>معلومات ولي الأمر</span>
          <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>أحكام الميثاق</span>
          <span className={currentStep >= 4 ? 'text-primary font-medium' : ''}>التوقيع</span>
        </div>
      </div>

      {/* Header */}
      <Card className="mb-8 border shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
          <CardTitle className="text-center text-lg sm:text-xl font-semibold">
            ميثاق الشراكة بين المدرسة وولي الأمر
          </CardTitle>
          <p className="text-center text-primary-foreground/80 mt-2 text-sm">
            وزارة التربية والتعليم - المملكة العربية السعودية
          </p>
        </CardHeader>
        <CardContent className="pt-6 text-foreground leading-6">
          <div className="bg-muted border-r-4 border-primary p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-3 flex items-center text-sm">
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              مقدمة
            </h3>
            <p className="mb-3 text-muted-foreground text-sm">
              في إطار تفعيل الشراكة الفاعلة بين المدرسة وولي الأمر وتعزيز دورهما في دعم التحصيل وسلوك أبنائنا الطلبة، يهدف هذا الميثاق إلى توضيح الأدوار
              والمسؤوليات المتبادلة بين الطرفين بما يضمن توفير بيئة تعليمية آمنة ومحفزة.
            </p>
            <p className="text-muted-foreground text-sm">
              ويعد توقيع ولي الأمر على هذا الميثاق إقرارًا بالاطلاع على بنوده وفهمها والالتزام بمقتضاها، كما يمثل اتفاقًا على التعاون البناء مع المدرسة
              لتحقيق مخرجات تعليمية وسلوكية متميزة لأبنائنا وبناتنا.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: School Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-lg flex items-center text-secondary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1" />
                </svg>
                الجزء الأول: معلومات المدرسة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">الإدارة التعليمية</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.educationAuthority}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">اسم المدرسة</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.schoolName}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">الصف الدراسي والشعبة</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.grade}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">اسم الطالب/ـة</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.studentName}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">السجل المدني للطالب</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm font-mono">{formData.studentId}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">Route ID (من النظام)</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm font-mono">{eid || ''}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Parent Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/70 to-primary/80 border-b">
              <CardTitle className="text-lg flex items-center text-primary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                الجزء الثاني: معلومات ولي الأمر
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">اسم ولي الأمر</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.parentName}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">رقم الهوية الوطنية</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm font-mono">{formData.parentId}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">رقم التواصل</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.phone}</div>
                </div>
                <div className="space-y-2">
                  <div className="block text-sm font-medium text-foreground mb-2">البريد الإلكتروني</div>
                  <div className="bg-muted rounded px-3 py-2 text-sm">{formData.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Conduct Terms */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Validity Period */}
          <Card className="border border-primary/20 shadow-md bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-foreground">مدة وصلاحية هذا الميثاق:</h4>
                  <p className="text-muted-foreground">{conductTerms.validityPeriod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Commitments */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-base flex items-center text-secondary-foreground">
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1" />
                </svg>
                {conductTerms.schoolCommitments.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                {conductTerms.schoolCommitments.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <span className="w-5 h-5 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-bold ml-2">
                        {sectionIndex + 1}
                      </span>
                      {section.title}
                    </h4>
                    <ul className="space-y-1 pr-7">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-muted-foreground text-xs leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-secondary rounded-full mt-1.5 ml-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parent Commitments */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/60 to-primary/70 border-b">
              <CardTitle className="text-base flex items-center text-primary-foreground">
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {conductTerms.parentCommitments.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                {conductTerms.parentCommitments.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <span className="w-5 h-5 bg-primary/20 text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold ml-2">
                        {sectionIndex + 1}
                      </span>
                      {section.title}
                    </h4>
                    <ul className="space-y-1 pr-7">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-muted-foreground text-xs leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-1.5 ml-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Signature */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-lg flex items-center text-secondary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                التوقيع والاعتماد
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Summary Information */}
              <div className="bg-muted border rounded-lg p-3 mb-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">ملخص البيانات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><span className="font-medium">المدرسة:</span> {formData.schoolName}</div>
                  <div><span className="font-medium">الطالب:</span> {formData.studentName}</div>
                  <div><span className="font-medium">ولي الأمر:</span> {formData.parentName}</div>
                  <div><span className="font-medium">الصف:</span> {formData.grade}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-accent/20 border border-accent rounded-lg">
                  <div className="h-5 w-5 border-border rounded mt-0.5 bg-accent/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">إقرار ولي الأمر:</span><br />
                    أقر بأنني اطلعت على جميع بنود ميثاق الشراكة بين المدرسة وولي الأمر، وفهمت محتواها بالكامل، 
                    وأتعهد بالالتزام بجميع البنود والشروط المذكورة أعلاه، والتعاون مع المدرسة لضمان تحقيق المصلحة الفضلى لابني/ابنتي.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mt-4">
                  <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-secondary rounded-lg py-6 bg-secondary/10">
                    <svg className="w-8 h-8 text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-secondary-foreground text-xs mb-1">ختم وزارة التربية والتعليم</div>
                    <div className="text-lg font-bold text-secondary-foreground">معتمد</div>
                  </div>
                  <div>
                    <div className="block text-xs font-medium text-foreground mb-2">التاريخ</div>
                    <div className="bg-muted text-center font-medium text-sm rounded px-3 py-2">{today}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button 
              type="button" 
              className="px-4 py-2 border rounded bg-white hover:bg-muted text-foreground"
              onClick={handlePrevious}
            >
              السابق
            </button>
          )}
          <Link href={eid ? `/child/${encodeURIComponent(eid)}` : '/dashboard'}>
            <button className="px-4 py-2 border rounded bg-muted text-foreground" type="button">إغلاق</button>
          </Link>
        </div>
        <div className="flex gap-3">
          {currentStep < 4 && (
            <button 
              type="button" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded"
              onClick={handleNext}
            >
              التالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
