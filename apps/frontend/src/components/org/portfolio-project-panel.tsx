'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Button, Dialog, FormActions, LoadingIndicator, SidePanel, StatusBadge } from '@constellation/shared/ui';
import { DetailRefreshButton } from '@/components/ui/detail-refresh-button';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import {
  deletePortfolioProject,
  getPortfolioProject,
  type PortfolioProjectDto,
} from '@/services/freelancer-api';

type PortfolioProjectPanelProps = Readonly<{
  profileId: string;
  project: PortfolioProjectDto | null;
  open: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (projectId: string) => void;
  onProjectUpdated: (project: PortfolioProjectDto) => void;
}>;

export function PortfolioProjectPanel({
  profileId,
  project,
  open,
  canDelete,
  onOpenChange,
  onDeleted,
  onProjectUpdated,
}: PortfolioProjectPanelProps) {
  const t = useTranslations('org.upwork.profile.portfolio');
  const tList = useTranslations('dashboard.admin.listControls');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onPanelOpenChange = useCallback(
    (next: boolean) => {
      if (!next && deleting) return;
      if (!next) setDeleteOpen(false);
      onOpenChange(next);
    },
    [deleting, onOpenChange],
  );

  const onRefresh = useCallback(async () => {
    if (!project) return;
    setRefreshing(true);
    try {
      const result = await getPortfolioProject(profileId, project.id, { trackGlobalLoading: false });
      onProjectUpdated(result.project);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setRefreshing(false);
    }
  }, [onProjectUpdated, profileId, project, tErrors]);

  const onDeleteDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next && deleting) return;
      setDeleteOpen(next);
    },
    [deleting],
  );

  const onConfirmDelete = useCallback(async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await deletePortfolioProject(profileId, project.id);
      showUserSuccessToast(t('deleted'));
      setDeleteOpen(false);
      onOpenChange(false);
      onDeleted(project.id);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setDeleting(false);
    }
  }, [onDeleted, onOpenChange, profileId, project, t, tErrors]);

  const onOpenDelete = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const onCancelDelete = useCallback(() => {
    onDeleteDialogOpenChange(false);
  }, [onDeleteDialogOpenChange]);

  return (
    <>
      <SidePanel
        open={open}
        onOpenChange={onPanelOpenChange}
        title={project?.title?.trim() || t('untitled')}
        description={project?.role ? `${t('role')}: ${project.role}` : undefined}
        testId={TEST_IDS.upworkProfile.portfolioPanel}
        headerActions={
          project ? (
            <DetailRefreshButton
              ariaLabel={tList('refreshDetailLabel')}
              isRefreshing={refreshing}
              onRefresh={onRefresh}
              testId={TEST_IDS.upworkProfile.portfolioPanelRefresh}
            />
          ) : null
        }
        footer={
          canDelete && project ? (
            <FormActions className="justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={onOpenDelete}
                disabled={deleting || refreshing}
                testId={TEST_IDS.upworkProfile.portfolioDelete}
                fullWidth={false}
              >
                {t('delete')}
              </Button>
            </FormActions>
          ) : null
        }
      >
        {!project ? (
          <div className="flex min-h-[min(24rem,60vh)] items-center justify-center">
            <LoadingIndicator />
          </div>
        ) : (
          <div
            className={`space-y-6 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}
          >
            {project.publishedOn ? (
              <p className="text-sm text-muted-foreground">
                {t('publishedOn', { value: project.publishedOn })}
              </p>
            ) : null}

            {project.projectUrl ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('projectUrl')}</h3>
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm font-medium text-primary hover:underline"
                  data-testid={TEST_IDS.upworkProfile.portfolioPanelOpenUpwork}
                >
                  {t('openOnUpwork')}
                </a>
              </section>
            ) : null}

            {project.description ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('description')}</h3>
                <p className="whitespace-pre-wrap text-sm text-foreground">{project.description}</p>
              </section>
            ) : null}

            {project.technologies.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('technologies')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <StatusBadge key={tech} variant="secondary" label={tech} />
                  ))}
                </div>
              </section>
            ) : null}

            {project.links.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('links')}</h3>
                <ul className="space-y-1.5">
                  {project.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm font-medium text-primary hover:underline"
                      >
                        {link.label?.trim() || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.imageUrls.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('images')}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element -- Upwork CDN URLs; not in next/image remotePatterns
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </SidePanel>

      <Dialog
        open={deleteOpen}
        onOpenChange={onDeleteDialogOpenChange}
        title={t('deleteTitle')}
        size="sm"
        testId={TEST_IDS.upworkProfile.portfolioDeleteDialog}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              onClick={onCancelDelete}
              disabled={deleting}
              testId={TEST_IDS.upworkProfile.portfolioDeleteCancel}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={onConfirmDelete}
              disabled={deleting}
              testId={TEST_IDS.upworkProfile.portfolioDeleteConfirm}
            >
              {deleting ? tCommon('waiting') : t('deleteConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          {t('deleteDescription', { title: project?.title?.trim() || t('untitled') })}
        </p>
      </Dialog>
    </>
  );
}
