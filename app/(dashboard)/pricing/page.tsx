import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  // Placeholder pricing data - would integrate with Stripe for PTA system
  const plans = [
    {
      name: 'Basic PTA',
      price: 0,
      interval: 'year',
      features: [
        'Payment Tracking',
        'Student Management',
        'Basic Reporting',
        'Parent Portal Access',
      ],
      priceId: 'basic-pta',
    },
    {
      name: 'Premium PTA',
      price: 10000, // $100.00
      interval: 'year',
      features: [
        'Everything in Basic, and:',
        'Advanced Analytics',
        'Email Notifications',
        'Bulk Operations',
        'Priority Support',
      ],
      priceId: 'premium-pta',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          PTA Management System Pricing
        </h1>
        <p className="text-lg text-gray-600">
          Choose the plan that works best for your school
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.price}
            interval={plan.interval}
            features={plan.features}
            priceId={plan.priceId}
          />
        ))}
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  features: string[];
  priceId: string;
}) {
  const isBasic = price === 0;
  
  return (
    <div className={`pt-6 p-8 rounded-lg border-2 ${isBasic ? 'border-gray-200' : 'border-orange-500'} ${!isBasic ? 'relative' : ''}`}>
      {!isBasic && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Recommended
          </span>
        </div>
      )}
      
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        {isBasic ? 'Free' : `$${price / 100}`}{' '}
        {!isBasic && (
          <span className="text-xl font-normal text-gray-600">
            per school / {interval}
          </span>
        )}
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={async () => {
        'use server';
        // Placeholder for checkout action
        console.log('Checkout for:', priceId);
      }}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}