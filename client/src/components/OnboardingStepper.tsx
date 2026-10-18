const steps = [
  { number: 1, title: 'Store Profile', urdu: 'سٹور پروفائل' },
  { number: 2, title: 'Approval', urdu: 'منظوری' },
  { number: 3, title: 'Plan & Rates', urdu: 'پلان اور ریٹس' },
  { number: 4, title: 'Store Placement Payment', urdu: 'سٹور پلیسمنٹ ادائیگی' },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <section className="stepper-wrap" aria-label="Seller onboarding progress">
      <div className="stepper">
        {steps.map((step) => {
          const state = step.number < currentStep ? 'complete' : step.number === currentStep ? 'active' : '';
          return (
            <div className={`step ${state}`} key={step.number} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="step-number">{state === 'complete' ? '✓' : step.number}</span>
              <span>
                <small>STEP {step.number} OF 4</small>
                <strong>{step.title}</strong>
                <em>{step.urdu}</em>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
