"use client";

import * as React from "react";
import AddressFields, { AddressValue } from "@/app/components/forms/AddressFields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AddressDemoPage() {
  const [val, setVal] = React.useState<AddressValue>({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const isComplete = val.emirateId && val.areaId && val.streetName && val.houseNumber;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تجربة مكوّن العنوان
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            نموذج تفاعلي لإدخال بيانات السكن
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
          <CardHeader className="bg-primary/5 dark:bg-primary/10">
            <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2" dir="rtl">
              <span className="text-2xl">🏠</span>
              بيانات السكن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AddressFields
                value={val}
                onChange={setVal}
                required={{ emirate: true, area: true, streetName: true, houseNumber: true }}
              />
              
              <div className="flex gap-3 pt-4" dir="rtl">
                <Button
                  type="submit"
                  disabled={!isComplete || submitted}
                  className="flex-1 h-11 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {submitted ? "✓ تم الحفظ" : "حفظ البيانات"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVal({})}
                  className="h-11 rounded-lg"
                >
                  إعادة تعيين
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Data Preview Card */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between" dir="rtl">
              <span>معاينة البيانات</span>
              {isComplete && (
                <Badge variant="default" className="bg-green-500">
                  مكتمل
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4" dir="rtl">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto">
                {JSON.stringify(val, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10">
          <CardContent className="p-4" dir="rtl">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              💡 <strong>ملاحظة:</strong> يتم تحميل الإمارات تلقائياً، وبعد اختيار الإمارة يتم تحميل المناطق المرتبطة بها.
              جميع الحقول مطلوبة في هذا المثال.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
