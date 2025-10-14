"use client";

import * as React from "react";
import MyLandPicker from "@/app/components/Onwani/MyLandPicker";
import type { OnwaniSelection } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnwaniDemoPage() {
  const [sel, setSel] = React.useState<OnwaniSelection | null>(null);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Onwani + MyLand Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <MyLandPicker
            defaultMunicipality="ADM"
            showOverlayShape
            onOk={(s) => setSel(s)}
            onCancel={() => setSel(null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm">{JSON.stringify(sel, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
