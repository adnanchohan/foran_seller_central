import type { ReactNode } from 'react';
import { OnboardingStepper } from './OnboardingStepper';
import { PageLayout } from './PageLayout';

export function OnboardingLayout({
  step,
  eyebrow,
  title,
  description,
  children,
}: {
  step: number;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <PageLayout>
      <OnboardingStepper currentStep={step} />
      <section className="page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      {children}
    </PageLayout>
  );
}
