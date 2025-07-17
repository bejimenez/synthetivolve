'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { UsdaFoodDetails } from '@/lib/nutrition.types';

// This component would integrate QuaggaJS for actual barcode scanning.
// For now, it provides a simulated scan.

export function BarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const simulateScan = async () => {
    setIsScanning(true);
    toast('Simulating Scan', {
      description: 'Searching for a banana...',
    });

    try {
      // Simulate a delay for scanning
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate finding a UPC and fetching details for a banana (fdcId: 11090)
      const fdcId = 11090; 
      const response = await fetch(`/api/nutrition/usda/details?fdcId=${fdcId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch food details from USDA API');
      }
      
      const foodDetails: UsdaFoodDetails = await response.json();

      toast.success('Scan Complete', {
        description: `Found: ${foodDetails.description}`,
        duration: 3000,
      });

      // Redirect to nutrition logger page, potentially passing food details as query params or state
      // For simplicity, we'll just redirect to the main nutrition page.
      router.push('/nutrition');

    } catch (error) {
      console.error('Error during simulated scan:', error);
      toast.error('Scan Failed', {
        description: 'Could not complete scan or fetch food details.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Barcode Scanner</h2>
      <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <CardHeader>
          <CardTitle>Scan a Food Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-muted-foreground">
            Barcode scanning functionality would be implemented here using QuaggaJS.
          </p>
          <p className="text-muted-foreground">
            This would search USDA branded foods by UPC.
          </p>
          <Button onClick={simulateScan} disabled={isScanning}>
            {isScanning ? 'Scanning...' : 'Simulate Scan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
