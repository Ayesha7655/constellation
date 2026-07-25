import {
  DEFAULT_UPWORK_SCORING_THRESHOLDS,
  resolveUpworkRelevancyBand,
  type UpworkScoringThresholds,
} from '@constellation/shared';
import type { StatusBadgeVariant } from '@constellation/shared/ui';

export function upworkRelevancyBadgeVariant(
  score: number,
  thresholds: UpworkScoringThresholds = DEFAULT_UPWORK_SCORING_THRESHOLDS,
): StatusBadgeVariant {
  switch (resolveUpworkRelevancyBand(score, thresholds)) {
    case 'green':
      return 'emerald';
    case 'orange':
      return 'amber';
    case 'yellow':
      return 'violet';
    case 'red':
      return 'rejected';
  }
}
