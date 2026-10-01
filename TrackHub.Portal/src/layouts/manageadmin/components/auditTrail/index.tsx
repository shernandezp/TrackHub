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

import { useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import { getAccountByUser } from "api/manager/accounts";
import { getAuditTrail } from "api/manager/auditEvents";
import type { AuditEvent } from "api/manager/auditEvents";
import { notifyApiError } from "api/core/errors";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

// "UploadDocument" -> "Upload document": actions are an open set, so an unmapped one still reads.
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
  .replace(/ ([A-Z])/g, (_, c: string) => ` ${c.toLowerCase()}`);

function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

function ManageAuditTrail() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const accountIdRef = useRef<string | null>(null);
  const loaded = useRef(false);

  const loadPage = async (cursor: string | null) => {
    setLoading(true);
    try {
      accountIdRef.current ??= (await getAccountByUser())?.accountId ?? null;
      if (!accountIdRef.current) return;
      const page = await getAuditTrail(accountIdRef.current, cursor);
      setAuditTrail(current => (cursor ? [...current, ...page.items] : page.items));
      setNextCursor(page.nextCursor ?? null);
      setHasMore(page.hasMore);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!expanded || loaded.current) return;
    loaded.current = true;
    loadPage(null);
  }, [expanded]);

  const actor = (item: AuditEvent) =>
    `${t(`auditTrail.actorTypes.${item.actorType}` as never, { defaultValue: item.actorType })}: ${item.actorName ?? item.actorId}`;

  return (
    <TableAccordion sectionKey="audit-trail" title={t('auditTrail.title')} expanded={expanded} setExpanded={setExpanded}>
      <Table
        columns={[
          { name: 'action', title: t('generic.action'), align: 'left' },
          { name: 'actor', title: t('auditTrail.actor'), align: 'center' },
          { name: 'resource', title: t('auditTrail.resource'), align: 'center' },
          { name: 'result', title: t('auditTrail.result'), align: 'center' },
          { name: 'occurredAt', title: t('auditTrail.occurredAt'), align: 'center' },
          { name: 'id' }
        ]}
        rows={auditTrail.map(item => ({
          action: <TextCell>{humanize(item.action)}</TextCell>,
          actor: <TextCell>{actor(item)}</TextCell>,
          resource: <TextCell>{`${humanize(item.resourceType)}: ${item.resourceName ?? item.resourceId}`}</TextCell>,
          result: <TextCell>{t(`auditTrail.results.${item.result}` as never, { defaultValue: item.result })}</TextCell>,
          occurredAt: <TextCell>{formatDateTime(item.occurredAt)}</TextCell>,
          id: item.auditEventId
        }))}
        selectedField="action"
        serverPaged
      />
      {hasMore && (
        <ArgonBox display="flex" justifyContent="center" mt={1}>
          <ArgonButton variant="text" color="dark" onClick={() => loadPage(nextCursor)}>
            {t('auditTrail.loadMore')}
          </ArgonButton>
        </ArgonBox>
      )}
    </TableAccordion>
  );
}

export default ManageAuditTrail;
