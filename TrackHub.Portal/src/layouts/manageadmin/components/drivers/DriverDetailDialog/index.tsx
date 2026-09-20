/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

/**
 * Everything about ONE driver that is not the profile form: credentials and devices. Opened from
 * the drivers table so the table itself stays one row per driver with a single action.
 */

import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ArgonButton from 'components/ArgonButton';
import ArgonTypography from 'components/ArgonTypography';
import DriverAccessPanel from 'layouts/manageadmin/components/drivers/DriverAccessPanel';
import type { Driver } from 'api/manager/drivers';

interface DriverDetailDialogProps {
  accountId: string;
  driver: Driver | null;
  onClose: () => void;
}

function DriverDetailDialog({ accountId, driver, onClose }: DriverDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={driver !== null} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <ArgonTypography variant="h5">{driver?.name}</ArgonTypography>
        <ArgonTypography variant="caption" color="text">
          {[driver?.documentNumber, driver?.phone].filter(Boolean).join(' · ')}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent>
        {driver && <DriverAccessPanel accountId={accountId} driverId={driver.driverId} />}
      </DialogContent>
      <DialogActions>
        <ArgonButton color="secondary" onClick={onClose}>
          {t('generic.close')}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
}

export default DriverDetailDialog;
