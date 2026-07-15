import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { Feedback } from '../../types';

const feedbackIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  const Icon = feedbackIcons[feedback.tone];

  return (
    <div className={`feedback feedback-${feedback.tone}`} role="status">
      <Icon size={17} aria-hidden="true" />
      <span>{feedback.message}</span>
    </div>
  );
}
