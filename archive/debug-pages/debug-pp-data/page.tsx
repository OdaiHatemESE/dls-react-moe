'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DebugPPDataPage() {
  const [studentId, setStudentId] = useState('SST-1-1-Pers-27562');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setApiData(null);

    try {
      // Fetch from our API endpoint
      const response = await fetch(`/api/PP/student/${encodeURIComponent(studentId)}?nocache=1`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(`API Error: ${errorData.error || response.statusText}`);
        return;
      }

      const data = await response.json();
      setApiData(data);
    } catch (err: any) {
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">PP API Data Debug Tool</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Student Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter Student Person ID (e.g., SST-1-1-Pers-27562)"
              className="flex-1"
            />
            <Button onClick={fetchData} disabled={loading || !studentId}>
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <pre className="text-sm text-red-600">{error}</pre>
          </CardContent>
        </Card>
      )}

      {apiData && (
        <>
          <Card className="mb-6">
            <CardHeader className="bg-blue-50">
              <CardTitle>📊 Contacts Comparison</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Contacts from API:</h3>
                {apiData.contacts && apiData.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {apiData.contacts.map((contact: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-semibold">Type:</span> {contact.type}
                          </div>
                          <div>
                            <span className="font-semibold">Value:</span> {contact.value}
                          </div>
                          <div>
                            <span className="font-semibold">isPrimary:</span>{' '}
                            <span className={contact.isPrimary ? 'text-green-600 font-bold' : 'text-red-600'}>
                              {String(contact.isPrimary)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No contacts found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="bg-green-50">
              <CardTitle>📍 Addresses Comparison</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Addresses from API:</h3>
                {apiData.addresses && apiData.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {apiData.addresses.map((address: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-semibold">Country:</span> {address.country}
                          </div>
                          <div>
                            <span className="font-semibold">City:</span> {address.city}
                          </div>
                          <div>
                            <span className="font-semibold">Region:</span> {address.region}
                          </div>
                          <div>
                            <span className="font-semibold">isPrimary:</span>{' '}
                            <span className={address.isPrimary ? 'text-green-600 font-bold' : 'text-red-600'}>
                              {String(address.isPrimary)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No addresses found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle>🔍 Full API Response (Raw JSON)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-[600px]">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
