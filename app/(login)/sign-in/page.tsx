import { Suspense } from 'react';
import { PTALogin } from '../pta-login';

export default function SignInPage() {
  return (
    <Suspense>
      <PTALogin mode="signin" />
    </Suspense>
  );
}
