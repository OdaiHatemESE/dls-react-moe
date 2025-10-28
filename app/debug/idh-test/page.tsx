'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { IDHStudent, IDHApiResponse } from '@/app/types/idh';

export default function IDHTestPage() {
  const [sourceId, setSourceId] = useState('SST-1-1-Pers-1687158');
  const [fetchedData, setFetchedData] = useState<IDHStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<IDHStudent>>({
    studentNumber: '',
    schoolId: 'SCH-1001',
    primaryPhone: '+971501234567',
    otherPhone: '+971504444444',
    transportationType: 'Bus',
    emirate: 'Dubai',
    area: 'Jumeirah 2',
    street: 'Al Wasl Road',
    houseBuilding: 'Villa 15',
    region: 'Jumeirah',
    zone: 'Zone 7',
    plot: '123',
    mainPlot: '123-A',
    premises: 'Residential',
    latitude: '25.2048',
    longitude: '55.2708',
    attachment01: '',
    statusId: 5,
    sourceId: '',
    datetime: new Date().toISOString(),
  });

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setFetchedData(null);

    try {
      const response = await fetch(`/api/backoffice/idh?sourceId=${encodeURIComponent(sourceId)}`);
      const result: IDHApiResponse = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to fetch IDH data');
      }

      setFetchedData(result.data || null);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backoffice/idh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to insert IDH data');
      }

      alert('IDH data inserted successfully!');
      // Optionally refresh the fetched data
      if (formData.sourceId) {
        setSourceId(formData.sourceId);
        handleFetch();
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof IDHStudent, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">IDH API Test Page</h1>

      {/* Fetch Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. Fetch IDH Data by Source ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sourceId">Student Source ID</Label>
            <Input
              id="sourceId"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="e.g., SST-1-1-Pers-1687158"
            />
          </div>
          <Button onClick={handleFetch} disabled={loading || !sourceId}>
            {loading ? 'Fetching...' : 'Fetch IDH Data'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {fetchedData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold mb-2">Fetched Data:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(fetchedData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insert Section */}
      <Card>
        <CardHeader>
          <CardTitle>2. Insert/Update IDH Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentNumber">Student Number *</Label>
              <Input
                id="studentNumber"
                value={formData.studentNumber}
                onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="schoolId">School ID *</Label>
              <Input
                id="schoolId"
                value={formData.schoolId}
                onChange={(e) => handleInputChange('schoolId', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="formSourceId">Source ID *</Label>
              <Input
                id="formSourceId"
                value={formData.sourceId}
                onChange={(e) => handleInputChange('sourceId', e.target.value)}
                placeholder="e.g., SST-1-1-Pers-1687158"
                required
              />
            </div>
            <div>
              <Label htmlFor="primaryPhone">Primary Phone</Label>
              <Input
                id="primaryPhone"
                value={formData.primaryPhone}
                onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="otherPhone">Other Phone</Label>
              <Input
                id="otherPhone"
                value={formData.otherPhone}
                onChange={(e) => handleInputChange('otherPhone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="transportationType">Transportation Type</Label>
              <Input
                id="transportationType"
                value={formData.transportationType}
                onChange={(e) => handleInputChange('transportationType', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emirate">Emirate</Label>
              <Input
                id="emirate"
                value={formData.emirate}
                onChange={(e) => handleInputChange('emirate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="houseBuilding">House/Building</Label>
              <Input
                id="houseBuilding"
                value={formData.houseBuilding}
                onChange={(e) => handleInputChange('houseBuilding', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="statusId">Status ID</Label>
              <Input
                id="statusId"
                type="number"
                value={formData.statusId}
                onChange={(e) => handleInputChange('statusId', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <Button
            onClick={handleInsert}
            disabled={loading || !formData.studentNumber || !formData.schoolId || !formData.sourceId}
            className="w-full"
          >
            {loading ? 'Inserting...' : 'Insert/Update IDH Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
