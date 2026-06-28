import { ArrowRight } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon } from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { OnboardingMark } from '../../layouts/OnboardingLayout/OnboardingMark';
import { stepReached } from '../../store/slice';

// First screen of the wizard. Brand-forward, single primary CTA. The
// Skip link in the header lets impatient users bail straight into the
// main app.
export function WelcomeScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(stepReached('welcome'));
  }, [dispatch]);

  return (
    <div className="flex flex-col items-center gap-3xl text-center">
      <OnboardingMark size={96} />
      <div className="flex flex-col gap-m">
        <h1 className="text-2xl font-bold text-fg-default">Welcome to Universe</h1>
        <p className="max-w-md font-body text-sm font-normal leading-[1.5] text-fg-muted">
          Run language models locally on your machine. Your conversations stay on
          your hardware — nothing leaves the device.
        </p>
      </div>
      <Button
        variant="primary"
        size="md"
        trailingIcon={<Icon icon={ArrowRight} size="sm" weight="bold" />}
        onClick={() => navigate('/onboarding/mode')}
      >
        Get started
      </Button>
      <p className="text-caption text-fg-subtle">
        Takes about a minute. You can skip and come back later from Settings.
      </p>
    </div>
  );
}
