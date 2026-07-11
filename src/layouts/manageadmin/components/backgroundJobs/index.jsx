import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonTypography from "components/ArgonTypography";
import { getAccountByUser } from "api/manager/accounts";
import { getBackgroundJobRuns } from "api/manager/backgroundJobs";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

function TextCell({ children }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

TextCell.propTypes = {
  children: PropTypes.node
};

function ManageBackgroundJobs() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [jobs, setJobs] = useState([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (!expanded || loaded.current) return;
    loaded.current = true;

    async function loadJobs() {
      setLoading(true);
      try {
        const account = await getAccountByUser();
        if (!account?.accountId) return;
        const items = await getBackgroundJobRuns(account.accountId);
        setJobs(items || []);
      } catch (error) {
        notifyApiError(error);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [expanded]);

  return (
    <TableAccordion title={t('backgroundJobs.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'job', title: t('backgroundJobs.job'), align: 'left' },
          { name: 'status', title: t('backgroundJobs.status'), align: 'center' },
          { name: 'attempts', title: t('backgroundJobs.attempts'), align: 'center' },
          { name: 'started', title: t('backgroundJobs.startedAt'), align: 'center' },
          { name: 'id' }
        ]}
        rows={jobs.map(item => ({
          job: <TextCell>{item.jobKey}</TextCell>,
          status: <TextCell>{item.status}</TextCell>,
          attempts: <TextCell>{item.attempts}</TextCell>,
          started: <TextCell>{formatDateTime(item.startedAt)}</TextCell>,
          id: item.backgroundJobRunId
        }))}
        selectedField="job"
      />
    </TableAccordion>
  );
}

export default ManageBackgroundJobs;
