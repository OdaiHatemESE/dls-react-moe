'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ParentConductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eid = params?.id as string | undefined; // page context id (existing child route id)
  const studentId = searchParams.get('studentId') || ''; // real student sourcedId if provided

  const [agreed, setAgreed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    // Placeholder submit — wire to API later
    alert(`تم الإرسال بنجاح\nStudentId: ${studentId || 'N/A'}\nRoute Id: ${eid || 'N/A'}`);
  };

  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString('ar-SA');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 direction-rtl" dir="rtl">
      {/* Top nav */}
      <div className="mb-4 flex items-center justify-between">
        <Link 
          href={eid ? `/child/${encodeURIComponent(eid)}` : '/dashboard'}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          الرجوع
        </Link>
        {(studentId || eid) && (
          <div className="text-xs text-gray-500">
            {studentId ? (
              <span>Student ID: <span className="font-mono">{studentId}</span></span>
            ) : (
              <span>Route ID: <span className="font-mono">{eid}</span></span>
            )}
          </div>
        )}
      </div>

      {/* Header */}
      <Card className="mb-6 border border-gray-200">
        <CardHeader className="bg-primary">
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
            ميثاق الشراكة بين المدرسة وولي الأمر
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-gray-700 leading-7">
          <h3 className="font-semibold text-gray-900 mb-2">مقدمة</h3>
          <p className="mb-4">
            في إطار تفعيل الشراكة الفاعلة بين المدرسة وولي الأمر وتعزيز دورهما في دعم التحصيل وسلوك أبنائنا الطلبة، يهدف هذا الميثاق إلى توضيح الأدوار
            والمسؤوليات المتبادلة بين الطرفين بما يضمن توفير بيئة تعليمية آمنة ومحفزة. يلتزم كل طرف بما يحقق المصلحة الفضلى للطالب ويعزز السلوك الإيجابي
            ويثري التجربة التعليمية.
          </p>
          <p>
            ويعد توقيع ولي الأمر على هذا الميثاق إقرارًا بالاطلاع على بنوده وفهمها والالتزام بمقتضاها، كما يمثل اتفاقًا على التعاون البناء مع المدرسة
            لتحقيق مخرجات تعليمية وسلوكية متميزة لأبنائنا وبناتنا.
          </p>
        </CardContent>
      </Card>

      {/* Basic info form (reference UI) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">بيانات الطالب وولي الأمر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">الإدارة التعليمية</label>
                <Input placeholder="مثال: الإدارة العامة للتعليم بمحافظة ..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم المدرسة</label>
                <Input placeholder="مدرسة ..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">الصف الدراسي والشعبة</label>
                <Input placeholder="مثال: الخامس / أ" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم الطالب/ـة</label>
                <Input placeholder="اسم الطالب" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم ولي الأمر</label>
                <Input placeholder="اسم ولي الأمر (الأب / الأم / الوصي)" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">السجل المدني للطالب</label>
                <Input placeholder="XXXXXXXXXX" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">رقم الهوية الوطنية لولي الأمر</label>
                <Input placeholder="XXXXXXXXXX" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">رقم التواصل</label>
                <Input placeholder="05XXXXXXXX" inputMode="tel" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
                <Input placeholder="example@email.com" type="email" />
              </div>
              {/* Readonly IDs */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Student ID (من النظام)</label>
                  <Input value={studentId || ''} readOnly className="font-mono bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Route ID</label>
                  <Input value={(eid as string) || ''} readOnly className="font-mono bg-gray-50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">التزامات المدرسة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <ul className="list-disc pr-5 space-y-2">
              <li>توفير بيئة تعليمية آمنة ومحفزة تراعي الفروق الفردية وتضمن احترام الجميع.</li>
              <li>التواصل الفعال والمستمر مع ولي الأمر حول مستوى التحصيل والسلوك والانضباط.</li>
              <li>تقديم تعليم نوعي وفق المناهج المعتمدة، مع متابعة مستمرة لتقدم الطلبة.</li>
              <li>الحرص على العدالة والإنصاف في التعامل وتطبيق الأنظمة واللوائح المدرسية.</li>
              <li>توفير أنشطة وبرامج داعمة لتنمية المهارات والقيم والسلوك الإيجابي.</li>
              <li>حفظ سرية بيانات الطلبة وولي الأمر وعدم استخدامها إلا للأغراض التعليمية.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">التزامات ولي الأمر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <ul className="list-disc pr-5 space-y-2">
              <li>متابعة انتظام الطالب وحضوره اليومي والالتزام بالمواعيد الدراسية.</li>
              <li>الالتزام بالسلوك القويم داخل المدرسة وخارجها، وتشجيع الطالب على احترام الأنظمة.</li>
              <li>التعاون مع المدرسة لمعالجة الصعوبات الأكاديمية أو السلوكية عند ظهورها.</li>
              <li>الاطلاع الدوري على المنصات التعليمية والتقارير والرسائل الصادرة من المدرسة.</li>
              <li>توفير المستلزمات الدراسية والمحافظة على الكتب والزي المدرسي.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">السلوك الطلابي</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={6} className="leading-7" placeholder="نص السلوك الطلابي أو بنود إضافية..." />
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم ولي الأمر</label>
                <Input placeholder="توقيع ولي الأمر / الاسم الثلاثي" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم الطالب/ـة</label>
                <Input placeholder="توقيع الطالب / الاسم" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                id="agree"
                type="checkbox"
                className="h-4 w-4 border-gray-300 rounded"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                أوافق على جميع البنود المذكورة أعلاه وأتعهد بالالتزام بها
              </label>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-end gap-4">
              <div className="md:col-span-2 flex flex-col items-center justify-center border rounded-md py-6 bg-gray-50">
                <div className="text-gray-500 text-sm mb-1">ختم وزارة التربية والتعليم</div>
                <div className="text-2xl font-extrabold text-gray-800">معتمد</div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">التاريخ</label>
                <Input value={today} readOnly className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Link href={eid ? `/child/${encodeURIComponent(eid)}` : '/dashboard'} className="inline-flex">
            <Button variant="secondary" type="button">الرجوع</Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!agreed} className={!agreed ? 'opacity-60 cursor-not-allowed' : ''}>
              إرسال
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
