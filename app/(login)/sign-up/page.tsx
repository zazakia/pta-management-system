import { Suspense } from 'react';
import { PTALogin } from '../pta-login';

export default function SignUpPage() {
  return (
    <Suspense>
      <PTALogin mode="signup" />
    </Suspense>
  );
}
