interface StepperProps {
  currentStep: number;
}

const steps = [
  { step: 1, title: "Store Profile", label: "Details & CNIC" },
  { step: 2, title: "Manual Approval", label: "Admin Verification" },
  { step: 3, title: "Select Plan", label: "Basic or Premium" },
  { step: 4, title: "Store Placement", label: "Activation Payment" },
];

export function OnboardingStepper({ currentStep }: StepperProps) {
  return (
    <div className="stepper-wrap">
      <div className="stepper-inner">
        <div className="stepper-header-content">
          <div className="onboarding-page-header-eyebrow">
            <span className="eyebrow-bullet">●</span> NATIONAL SELLER ONBOARDING
          </div>
          <h1 className="onboarding-page-title">
            <span>Register Your Store</span> <span className="title-slash">/</span>{" "}
            <span className="urdu-title" dir="rtl">
              نیا اسٹور رجسٹر کریں
            </span>
          </h1>
          <p className="onboarding-page-desc">
            Set up your merchant profile, store branding, and contact details to start selling
            across Pakistan.
          </p>
        </div>

        <div className="stepper">
          {steps.map((s) => {
            const isComplete = s.step < currentStep;
            const isActive = s.step === currentStep;
            return (
              <div
                key={s.step}
                className={`step ${isComplete ? "complete" : ""} ${isActive ? "active" : ""}`}
              >
                <div className="step-number">{isComplete ? "✓" : s.step}</div>
                <span>
                  <small>Step {s.step}</small>
                  <strong>{s.title}</strong>
                  <em>{s.label}</em>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
