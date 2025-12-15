import React from 'react';

interface CheckoutStepsProps {
  currentStep: number; // 1-4
  steps?: string[];
}

const DEFAULT_STEPS = [
  'Контактные данные',
  'Доставка',
  'Оплата',
  'Подтверждение',
];

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep, steps = DEFAULT_STEPS }) => {
  const total = steps.length;

  return (
    <div className="checkout-steps" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Progress line background */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 4,
            background: '#f0f0f0',
            transform: 'translateY(-50%)',
            borderRadius: 2,
            zIndex: 0,
          }}
        />
        {/* Progress line active */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            height: 4,
            background: '#1677ff',
            transform: 'translateY(-50%)',
            borderRadius: 2,
            zIndex: 1,
            width: `${((currentStep - 1) / (total - 1)) * 100}%`,
            transition: 'width 300ms ease',
          }}
        />
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;
          const size = 40;
          return (
            <div
              key={label}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  background: isCompleted ? '#52c41a' : isCurrent ? '#1677ff' : '#fff',
                  color: isCompleted || isCurrent ? '#fff' : '#8c8c8c',
                  border: isCompleted || isCurrent ? '2px solid transparent' : '2px solid #d9d9d9',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(22,119,255,0.15)' : 'none',
                  transition: 'all 200ms ease',
                }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12, maxWidth: 90, color: isFuture ? '#8c8c8c' : '#262626' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 13, color: '#595959' }}>
        Шаг {currentStep} из {total}: {steps[currentStep - 1]}
      </div>
    </div>
  );
};

export default CheckoutSteps;
