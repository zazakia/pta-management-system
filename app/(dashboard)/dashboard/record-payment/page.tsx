'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParentSearchSelect } from '@/components/parent-search-select';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { mutate } from 'swr';
import { PAYMENT_CATEGORY_OPTIONS, getCategoryConfig, PaymentCategory } from '@/lib/constants/payment-categories';

interface PaymentFormData {
  parent_id: string;
  amount: number;
  category: string;
  payment_method: string;
  notes: string;
  receipt_url: string;
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    parent_id: '',
    amount: 250,
    category: 'membership',
    payment_method: 'cash',
    notes: '',
    receipt_url: ''
  });

  const handleParentSelect = (parent: any) => {
    setSelectedParent(parent);
    setFormData(prev => ({ ...prev, parent_id: parent.id }));
    setError('');
  };

  const handleCategoryChange = (category: string) => {
    const config = getCategoryConfig(category as PaymentCategory);
    setFormData(prev => ({ 
      ...prev, 
      category,
      amount: config.defaultAmount || prev.amount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParent) {
      setError('Please select a parent/guardian');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      const payment = await response.json();
      
      // Refresh payment data
      mutate('/api/payments');
      mutate('/api/parents');
      
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          parent_id: '',
          amount: 250,
          category: 'membership',
          payment_method: 'cash',
          notes: '',
          receipt_url: ''
        });
        setSelectedParent(null);
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error recording payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  Payment Recorded Successfully!
                </h2>
                <p className="text-green-600 mb-4">
                  PHP {formData.amount} payment for {selectedParent?.name} has been recorded.
                </p>
                <p className="text-sm text-green-600">
                  All students under this parent have been marked as paid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <CreditCard className="mr-3 h-6 w-6" />
          Record PTA Payment
        </h1>
        <p className="text-gray-600 mt-2">
          Record a PHP 250 PTA contribution. This will automatically mark all children under the selected parent as paid.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Selection */}
            <div className="space-y-2">
              <Label>Select Parent/Guardian *</Label>
              <ParentSearchSelect
                onSelect={handleParentSelect}
                selectedParent={selectedParent}
              />
              {selectedParent && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedParent.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    Contact: {selectedParent.contact_number || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Students: {selectedParent.students?.length || 0}
                  </p>
                  {selectedParent.payment_status && (
                    <p className="text-sm text-orange-600 font-medium">
                      ⚠️ This parent has already paid for this school year
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Payment Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                {PAYMENT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                Suggested amount: PHP {getCategoryConfig(formData.category as PaymentCategory).defaultAmount}
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PHP) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  payment_method: e.target.value 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Receipt URL */}
            <div className="space-y-2">
              <Label htmlFor="receipt_url">Receipt/Reference (Optional)</Label>
              <Input
                id="receipt_url"
                type="text"
                value={formData.receipt_url}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  receipt_url: e.target.value 
                }))}
                placeholder="Receipt number, reference, or image URL"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Additional notes about this payment"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !selectedParent}
                className="flex-1"
              >
                {loading ? 'Recording Payment...' : 'Record Payment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}