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

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DashboardLayout from 'controls/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'controls/Navbars/DashboardNavbar';
import Footer from 'controls/Footer';
import Table from 'controls/Tables/Table';
import CompactSelect from 'controls/Selects/CompactSelect';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import FormDialog from 'controls/Dialogs/FormDialog';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import useForm from 'controls/Dialogs/useForm';
import { Name, Description } from 'controls/Tables/components/tableComponents';
import ArgonBox from 'components/ArgonBox';
import ArgonBadge from 'components/ArgonBadge';
import ArgonButton from 'components/ArgonButton';
import ArgonPagination from 'components/ArgonPagination';
import ArgonTypography from 'components/ArgonTypography';
import { useArgonController } from 'context';
import { useAccountByUser } from 'queries/accounts';
import { useTransportersByUser } from 'queries/transporters';
import { useDriversByAccount } from 'queries/drivers';
import { usePointsOfInterestByAccount } from 'queries/pointsOfInterest';
import { useAllGeofences } from 'queries/geofences';
import {
  useTrips,
  useTripDetail,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useAssignTrip,
  usePlanTripRoute,
  useTripLifecycle,
  useAddTripStop,
  useUpdateTripStop,
  useRemoveTripStop,
  useReorderTripStops,
  useStopProgress,
  useTollVehicleClasses,
  useCreateDelivery,
  useUpdateDelivery,
  useUpdateDeliveryOutcome,
  useDeleteDelivery,
  useRecordProofOfDelivery,
  useSetTransporterTollClass,
} from 'queries/trips';
import { useUploadDocument, useRefreshDocument } from 'queries/documents';
import { getAccountSettings } from 'api/manager/settings';
import { notifyApiError } from 'api/core/errors';
import { formatDateTime } from 'utils/dateUtils';
import { MAP_PROVIDERS } from 'controls/Maps/core/MapProviderContext';
import type { MapProvider } from 'controls/Maps/core/MapProviderContext';
import type { RoutePoint } from 'controls/Maps/core/mapTypes';
import type {
  TripListFilters,
  TripStopDtoInput,
  TripDtoInput,
  TripDelivery,
  TransporterTollClass,
} from 'api/tripManagement/trips';
import {
  toIso,
  toLocalInput,
  newClientEventId,
  buildDeliveryPayload,
  buildPodPayload,
  buildTollClassVariables,
  podDocumentFields,
  normalizeStopCity,
  isStopCityWithinLimit,
  STOP_CITY_MAX_LENGTH,
  DELIVERY_REQUIRED_FIELDS,
  POD_REQUIRED_FIELDS,
} from './tripWriteForms';
import type {
  DeliveryFormValues,
  DeliveryStatus,
  PodAttachment,
  PodFormValues,
  TollClassFormValues,
} from './tripWriteForms';
import TripDialog from './components/TripDialog';
import type { TripFormValues } from './components/TripDialog';
import StopDialog from './components/StopDialog';
import type { StopFormValues } from './components/StopDialog';
import RoutePlanner, { DEFAULT_CORRIDOR_METERS } from './components/RoutePlanner';
import TollPanel from './components/TollPanel';
import AssignmentPanel from './components/AssignmentPanel';
import ShareDialog from './components/ShareDialog';
import TripDetail from './components/TripDetail';
import DeliveryDialog from './components/DeliveryDialog';
import DeliveryOutcomeDialog from './components/DeliveryOutcomeDialog';
import PodDialog from './components/PodDialog';
import TollClassDialog from './components/TollClassDialog';

const PAGE_SIZE = 10;
const ALL = 'all';
const TRIP_STATUSES = ['Created', 'InProgress', 'Paused', 'Completed', 'Cancelled', 'Aborted'] as const;

/** Statuses whose trips are still being planned — stops and routes stay editable. */
const EDITABLE_STATUSES = new Set(['Created', 'Paused']);

/** Statuses that still accept delivery/POD writes — the backend's own rule is "not terminal". */
const TERMINAL_STATUSES = new Set(['Completed', 'Cancelled', 'Aborted']);

/**
 * The trip workspace is tabbed rather than stacked.
 *
 * Rendering every section at once made this screen roughly five viewports tall
 * and put TWO large maps (the planner's 52vh and the replay's 45vh) plus a POD
 * image gallery on screen together. Tabs keep the workspace to one screen, and
 * because each panel only mounts when it is opened, the replay query and the
 * second map cost nothing until a dispatcher actually asks for them.
 *
 * Ordered by how a trip is worked: plan it, crew it, run the stops, then look
 * at what it cost and what it left behind.
 */
const WORKSPACE_TABS = ['route', 'assignment', 'stops', 'tolls', 'pod', 'timeline', 'replay'] as const;
type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

/**
 * Dispatch board and trip workspace.
 *
 * The board is SERVER-paged and server-filtered: every filter travels in the
 * `trips` query, so the page a dispatcher sees is the page the backend built —
 * group visibility, feature gating and paging all stay on the server side.
 */
function TripManager() {
  const { t } = useTranslation();
  const [controller] = useArgonController();
  const { darkMode } = controller;

  /* ------------------------------------------------------------- settings */

  const [mapSettings, setMapSettings] = useState<{ maps: MapProvider; mapsKey: string | null }>({
    maps: MAP_PROVIDERS.OSM,
    mapsKey: null,
  });
  useEffect(() => {
    getAccountSettings()
      .then((settings) =>
        setMapSettings({
          maps: settings.maps === MAP_PROVIDERS.GOOGLE ? MAP_PROVIDERS.GOOGLE : MAP_PROVIDERS.OSM,
          mapsKey: settings.mapsKey,
        })
      )
      .catch(notifyApiError);
  }, []);

  /* -------------------------------------------------------------- filters */

  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string>(ALL);
  const [transporterFilter, setTransporterFilter] = useState<string>(ALL);
  const [driverFilter, setDriverFilter] = useState<string>(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const filters = useMemo<TripListFilters>(
    () => ({
      statuses: status === ALL ? null : [status],
      from: toIso(from),
      to: toIso(to),
      transporterId: transporterFilter === ALL ? null : transporterFilter,
      driverId: driverFilter === ALL ? null : driverFilter,
      search: search.trim() || null,
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    [status, from, to, transporterFilter, driverFilter, search, page]
  );

  /* --------------------------------------------------------------- data */

  const accountQuery = useAccountByUser();
  const accountId = accountQuery.data?.accountId;
  const transportersQuery = useTransportersByUser();
  const transporters = useMemo(() => transportersQuery.data ?? [], [transportersQuery.data]);
  const driversQuery = useDriversByAccount(accountId, { enabled: !!accountId });
  const drivers = useMemo(() => driversQuery.data ?? [], [driversQuery.data]);
  const poisQuery = usePointsOfInterestByAccount();
  const pois = useMemo(() => poisQuery.data ?? [], [poisQuery.data]);
  const geofencesQuery = useAllGeofences(false, { active: true });
  const geofences = useMemo(() => geofencesQuery.data ?? [], [geofencesQuery.data]);
  const vehicleClassesQuery = useTollVehicleClasses();
  const vehicleClasses = useMemo(
    () => vehicleClassesQuery.data ?? [],
    [vehicleClassesQuery.data]
  );

  const tripsQuery = useTrips(filters);
  const trips = useMemo(() => tripsQuery.data?.items ?? [], [tripsQuery.data]);
  const totalCount = tripsQuery.data?.totalCount ?? 0;

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Reset to the first tab when the dispatcher picks a different trip: leaving it
  // on, say, POD would open the next trip on a panel that is usually empty and
  // says nothing about why that trip was selected.
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('route');
  useEffect(() => setWorkspaceTab('route'), [selectedTripId]);
  const detailQuery = useTripDetail(selectedTripId);
  const detail = detailQuery.data;

  /* ---------------------------------------------------------- mutations */

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const assignTrip = useAssignTrip();
  const planRoute = usePlanTripRoute();
  const lifecycle = useTripLifecycle();
  const addStop = useAddTripStop();
  const updateStop = useUpdateTripStop();
  const removeStop = useRemoveTripStop();
  const reorderStops = useReorderTripStops();
  const stopProgress = useStopProgress();
  const createDelivery = useCreateDelivery();
  const updateDelivery = useUpdateDelivery();
  const updateDeliveryOutcome = useUpdateDeliveryOutcome();
  const deleteDelivery = useDeleteDelivery();
  const recordPod = useRecordProofOfDelivery();
  const setTransporterTollClass = useSetTransporterTollClass();
  const uploadDocument = useUploadDocument();
  const refreshDocument = useRefreshDocument();

  /* -------------------------------------------------------- trip dialog */

  const [tripOpen, setTripOpen] = useState(false);
  const [tripValues, tripChange, setTripValues, setTripErrors, validateTrip, tripErrors] =
    useForm<TripFormValues>({});

  const openTrip = (edit = false) => {
    if (edit && detail) {
      setTripValues({
        tripId: detail.trip.tripId,
        code: detail.trip.code,
        transporterId: detail.trip.transporterId,
        driverId: detail.trip.driverId ?? '',
        externalReference: detail.trip.externalReference,
        customerName: detail.trip.customerName,
        originName: detail.trip.originName,
        originLatitude: detail.trip.originLatitude,
        originLongitude: detail.trip.originLongitude,
        plannedStartAt: toLocalInput(detail.trip.plannedStartAt),
        plannedEndAt: toLocalInput(detail.trip.plannedEndAt),
        notes: detail.trip.notes,
        tollVehicleClass: detail.trip.tollVehicleClass,
      });
    } else {
      setTripValues({ plannedStartAt: toLocalInput(new Date().toISOString()) });
    }
    setTripErrors({});
    setTripOpen(true);
  };

  const saveTrip = async () => {
    if (
      !validateTrip([
        'code',
        'transporterId',
        'originName',
        'originLatitude',
        'originLongitude',
        'plannedStartAt',
      ])
    ) {
      return;
    }
    const payload: TripDtoInput = {
      code: tripValues.code as string,
      transporterId: tripValues.transporterId as string,
      driverId: tripValues.driverId || null,
      serviceOrderId: tripValues.serviceOrderId || null,
      externalReference: tripValues.externalReference || null,
      customerName: tripValues.customerName || null,
      originName: tripValues.originName as string,
      originLatitude: Number(tripValues.originLatitude),
      originLongitude: Number(tripValues.originLongitude),
      plannedStartAt: toIso(tripValues.plannedStartAt) as string,
      plannedEndAt: toIso(tripValues.plannedEndAt),
      notes: tripValues.notes || null,
      tollVehicleClass: tripValues.tollVehicleClass || null,
    };
    try {
      if (tripValues.tripId) {
        await updateTrip.mutateAsync({ tripId: tripValues.tripId, trip: payload });
      } else {
        const created = await createTrip.mutateAsync(payload);
        setSelectedTripId(created.tripId);
      }
      setTripOpen(false);
    } catch {
      // A duplicate code (TRIP_DUPLICATE_CODE) or a validation failure is shown
      // in the global toast; keep the dialog open so the entry is not lost.
    }
  };

  /* -------------------------------------------------------- stop dialog */

  const [stopOpen, setStopOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [stopValues, stopChange, setStopValues, setStopErrors, validateStop, stopErrors] =
    useForm<StopFormValues>({});

  const openStop = (tripStopId?: string) => {
    const existing = detail?.stops.find((stop) => stop.tripStopId === tripStopId);
    setStopValues(
      existing
        ? {
            tripStopId: existing.tripStopId,
            name: existing.name,
            address: existing.address,
            // Seeded from the stored value, NOT left blank for StopDialog to
            // re-resolve: the reverse-geocode effect only fires for a
            // coordinate pair it has not seen yet, so on a second edit of the
            // same stop it correctly stays silent — and a blank seed would then
            // save the locality away as null. `city` is the only place name the
            // anonymous customer snapshot may carry (spec 11 §7.8), so losing it
            // costs the customer their delivery's locality.
            city: existing.city ?? '',
            latitude: existing.latitude,
            longitude: existing.longitude,
            geofenceId: existing.geofenceId,
            arrivalRadiusMeters: existing.arrivalRadiusMeters,
            plannedArrivalFrom: toLocalInput(existing.plannedArrivalFrom),
            plannedArrivalTo: toLocalInput(existing.plannedArrivalTo),
            requiresPod: existing.requiresPod,
            priority: existing.priority,
            observations: existing.observations,
          }
        : { arrivalRadiusMeters: 150, priority: 0, requiresPod: false }
    );
    setStopErrors({});
    setPlacing(false);
    setStopOpen(true);
  };

  /** "Place on map" hides the dialog and arms the map's click handler. */
  const startPlacing = () => {
    setStopOpen(false);
    setPlacing(true);
  };

  const handleMapClick = (point: RoutePoint) => {
    setStopValues((previous) => ({
      ...previous,
      latitude: point.lat.toFixed(6),
      longitude: point.lng.toFixed(6),
      geofenceId: null,
      address: '',
    }));
    setPlacing(false);
    setStopOpen(true);
  };

  const saveStop = async () => {
    if (!selectedTripId) return;
    if (!validateStop(['name', 'latitude', 'longitude'])) return;
    // Mirror the backend's 200-char cap so an over-long locality is a field
    // message here rather than a 400 from the server.
    if (!isStopCityWithinLimit(stopValues.city)) {
      setStopErrors({ city: t('tripStops.cityTooLong', { max: STOP_CITY_MAX_LENGTH }) });
      return;
    }
    const payload: TripStopDtoInput = {
      name: stopValues.name as string,
      address: stopValues.address || null,
      city: normalizeStopCity(stopValues.city),
      latitude: Number(stopValues.latitude),
      longitude: Number(stopValues.longitude),
      geofenceId: stopValues.geofenceId || null,
      arrivalRadiusMeters: Number(stopValues.arrivalRadiusMeters) || 150,
      plannedArrivalFrom: toIso(stopValues.plannedArrivalFrom),
      plannedArrivalTo: toIso(stopValues.plannedArrivalTo),
      requiresPod: !!stopValues.requiresPod,
      priority: Number(stopValues.priority) || 0,
      observations: stopValues.observations || null,
    };
    try {
      if (stopValues.tripStopId) {
        await updateStop.mutateAsync({ tripStopId: stopValues.tripStopId, stop: payload });
      } else {
        await addStop.mutateAsync({ tripId: selectedTripId, stop: payload });
      }
      setStopOpen(false);
    } catch {
      // Surfaced by the global toast.
    }
  };

  /* ---------------------------------------------------- delivery dialogs */

  const stopLabel = (tripStopId?: string | null): string => {
    const stop = detail?.stops.find((candidate) => candidate.tripStopId === tripStopId);
    return stop ? `${stop.sequence}. ${stop.name}` : '';
  };

  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [
    deliveryValues,
    deliveryChange,
    setDeliveryValues,
    setDeliveryErrors,
    validateDelivery,
    deliveryErrors,
  ] = useForm<DeliveryFormValues>({});

  const openDelivery = (tripStopId: string, delivery?: TripDelivery) => {
    setDeliveryValues(
      delivery
        ? {
            deliveryId: delivery.deliveryId,
            tripStopId: delivery.tripStopId,
            reference: delivery.reference,
            clientName: delivery.clientName,
            branchName: delivery.branchName,
            productsSummary: delivery.productsSummary,
            observations: delivery.observations,
            sequenceIndex: delivery.sequenceIndex,
          }
        : { tripStopId, sequenceIndex: 0 }
    );
    setDeliveryErrors({});
    setDeliveryOpen(true);
  };

  const saveDelivery = async () => {
    if (!validateDelivery(DELIVERY_REQUIRED_FIELDS)) return;
    const payload = buildDeliveryPayload(deliveryValues);
    try {
      if (deliveryValues.deliveryId) {
        await updateDelivery.mutateAsync({ deliveryId: deliveryValues.deliveryId, delivery: payload });
      } else {
        await createDelivery.mutateAsync({
          tripStopId: deliveryValues.tripStopId as string,
          delivery: payload,
        });
      }
      setDeliveryOpen(false);
    } catch {
      // Surfaced by the global toast; the dialog stays open so nothing is lost.
    }
  };

  const [outcomeDelivery, setOutcomeDelivery] = useState<TripDelivery | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<DeliveryStatus>('Delivered');
  const [outcomeObservations, setOutcomeObservations] = useState('');
  // Minted once per outcome attempt and REUSED on retry: the command is
  // idempotent on this id, and a fresh id per attempt would defeat that.
  const [outcomeEventId, setOutcomeEventId] = useState('');

  const openOutcome = (delivery: TripDelivery) => {
    setOutcomeDelivery(delivery);
    setOutcomeStatus((delivery.status as DeliveryStatus) ?? 'Delivered');
    setOutcomeObservations(delivery.observations ?? '');
    setOutcomeEventId(newClientEventId());
  };

  const saveOutcome = async () => {
    if (!selectedTripId || !outcomeDelivery) return;
    try {
      await updateDeliveryOutcome.mutateAsync({
        tripId: selectedTripId,
        deliveryId: outcomeDelivery.deliveryId,
        status: outcomeStatus,
        observations: outcomeObservations.trim() || null,
        clientEventId: outcomeEventId,
      });
      setOutcomeDelivery(null);
    } catch {
      // Keep the dialog — and the SAME clientEventId — open for a retry.
    }
  };

  const [deleteDeliveryTarget, setDeleteDeliveryTarget] = useState<TripDelivery | null>(null);

  /* --------------------------------------------------------- POD capture */

  const [podOpen, setPodOpen] = useState(false);
  const [podValues, podChange, setPodValues, setPodErrors, validatePod, podErrors] =
    useForm<PodFormValues>({});
  const [podAttachments, setPodAttachments] = useState<PodAttachment[]>([]);
  // Same idempotency contract as the outcome command, on (tripStopId, clientEventId).
  const [podEventId, setPodEventId] = useState('');

  const openPod = (tripStopId: string) => {
    setPodValues({
      tripStopId,
      deliveryId: '',
      capturedAt: toLocalInput(new Date().toISOString()),
    });
    setPodErrors({});
    setPodAttachments([]);
    setPodEventId(newClientEventId());
    setPodOpen(true);
  };

  /**
   * POD evidence is uploaded through the EXISTING spec 04 document endpoint and
   * linked by id — no POD-specific upload surface exists or is needed. The
   * document is owned by the trip's transporter (spec 11 §11).
   */
  const uploadPodFiles = async (files: File[]) => {
    if (!accountId || !detail) return;
    for (const file of files) {
      try {
        const uploaded = await uploadDocument.mutateAsync({
          file,
          fields: podDocumentFields(accountId, detail.trip.transporterId, file.name),
        });
        setPodAttachments((previous) => [
          ...previous,
          {
            documentId: uploaded.documentId,
            fileName: uploaded.fileName,
            scanStatus: uploaded.scanStatus,
          },
        ]);
      } catch {
        // Surfaced by the global toast; the remaining files still upload.
      }
    }
  };

  /** Re-reads the scan verdict — an upload starts `Pending` and turns `Clean`. */
  const refreshPodAttachment = async (documentId: string) => {
    try {
      const document = await refreshDocument.mutateAsync(documentId);
      setPodAttachments((previous) =>
        previous.map((attachment) =>
          attachment.documentId === documentId
            ? { ...attachment, scanStatus: document.scanStatus }
            : attachment
        )
      );
    } catch {
      // Surfaced by the global toast.
    }
  };

  const savePod = async () => {
    if (!selectedTripId) return;
    if (!validatePod(POD_REQUIRED_FIELDS)) return;
    try {
      await recordPod.mutateAsync({
        tripId: selectedTripId,
        proofOfDelivery: buildPodPayload(podValues, podAttachments, podEventId),
      });
      setPodOpen(false);
    } catch {
      // POD_DOCUMENT_NOT_CLEAN and the rest surface in the global toast. The
      // dialog — and the clientEventId — survive so a retry stays idempotent.
    }
  };

  /* -------------------------------------------- transporter toll classes */

  const [tollClassOpen, setTollClassOpen] = useState(false);
  const [
    tollClassValues,
    tollClassChange,
    setTollClassValues,
    setTollClassErrors,
    ,
    tollClassErrors,
  ] = useForm<TollClassFormValues>({ target: 'transporterType' });
  const [savedTollClasses, setSavedTollClasses] = useState<TransporterTollClass[]>([]);

  const openTollClasses = () => {
    setTollClassValues({ target: 'transporterType' });
    setTollClassErrors({});
    setTollClassOpen(true);
  };

  const saveTollClass = async () => {
    const variables = buildTollClassVariables(tollClassValues);
    if (!variables) {
      setTollClassErrors({
        transporterTypeId:
          tollClassValues.target === 'transporterType' ? t('tolls.transporterClass.required') : undefined,
        transporterId:
          tollClassValues.target === 'transporter' ? t('tolls.transporterClass.required') : undefined,
        tollVehicleClassCode: tollClassValues.tollVehicleClassCode
          ? undefined
          : t('tolls.transporterClass.required'),
      });
      return;
    }
    try {
      const mapping = await setTransporterTollClass.mutateAsync(variables);
      setSavedTollClasses((previous) => [
        ...previous.filter(
          (candidate) => candidate.transporterTollClassId !== mapping.transporterTollClassId
        ),
        mapping,
      ]);
      setTollClassErrors({});
    } catch {
      // Surfaced by the global toast.
    }
  };

  /* --------------------------------------------------- lifecycle dialogs */

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reasonAction, setReasonAction] = useState<'cancel' | 'abort' | null>(null);
  const [reason, setReason] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [forceComplete, setForceComplete] = useState(false);
  const [skipStopId, setSkipStopId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const runLifecycle = (action: 'start' | 'pause' | 'resume') => {
    if (!selectedTripId) return;
    lifecycle.mutate({ action, tripId: selectedTripId });
  };

  const handleStopAction = (action: 'arrive' | 'depart' | 'skip', tripStopId: string) => {
    if (!selectedTripId) return;
    if (action === 'skip') {
      setSkipStopId(tripStopId);
      setSkipReason('');
      return;
    }
    stopProgress.mutate({
      action,
      tripId: selectedTripId,
      tripStopId,
      occurredAt: new Date().toISOString(),
      clientEventId: newClientEventId(),
    });
  };

  /* ---------------------------------------------------------------- board */

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: t('trips.allStatuses') },
      ...TRIP_STATUSES.map((value) => ({
        value,
        label: t(`trips.statuses.${value}` as 'trips.statuses.Created'),
      })),
    ],
    [t]
  );

  const transporterOptions = useMemo(
    () => [
      { value: ALL, label: t('trips.allTransporters') },
      ...transporters.map((transporter) => ({
        value: transporter.transporterId,
        label: transporter.name,
      })),
    ],
    [transporters, t]
  );

  const driverOptions = useMemo(
    () => [
      { value: ALL, label: t('trips.allDrivers') },
      ...drivers
        .filter((driver) => driver.active)
        .map((driver) => ({ value: driver.driverId, label: driver.name })),
    ],
    [drivers, t]
  );

  const statusColor = (value: string) =>
    value === 'InProgress'
      ? 'info'
      : value === 'Completed'
        ? 'success'
        : value === 'Paused'
          ? 'warning'
          : value === 'Created'
            ? 'primary'
            : 'secondary';

  // The board spans the FULL width, so it can afford the columns a dispatcher
  // actually scans by — who is carrying it and who is driving — without the
  // crowding that made a one-third-width board collide with itself.
  const columns = [
    { name: 'code', title: t('trips.code'), align: 'left' as const },
    { name: 'customer', title: t('trips.customerName'), align: 'left' as const },
    { name: 'transporter', title: t('trips.transporter'), align: 'left' as const },
    { name: 'driver', title: t('trips.driver'), align: 'left' as const },
    { name: 'plannedStart', title: t('trips.plannedStart'), align: 'left' as const },
    { name: 'stops', title: t('trips.stops'), align: 'center' as const },
    { name: 'status', title: t('trips.status'), align: 'center' as const },
    { name: 'id' },
  ];

  const rows = trips.map((trip) => ({
    code: <Name name={trip.code} />,
    customer: <Description description={trip.customerName ?? '-'} />,
    transporter: (
      <Description
        description={
          transporters.find((transporter) => transporter.transporterId === trip.transporterId)?.name ??
          '-'
        }
      />
    ),
    driver: (
      <Description
        description={drivers.find((driver) => driver.driverId === trip.driverId)?.name ?? '-'}
      />
    ),
    plannedStart: <Description description={formatDateTime(trip.plannedStartAt)} />,
    stops: <Name name={trip.stopCount} />,
    status: (
      <ArgonBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
        <ArgonBadge
          variant="gradient"
          color={statusColor(trip.status)}
          size="xs"
          container
          badgeContent={t(`trips.statuses.${trip.status}` as 'trips.statuses.Created')}
        />
        {trip.deviationOpenedAt && (
          <ArgonBadge
            variant="gradient"
            color="error"
            size="xs"
            container
            badgeContent={t('trips.deviation')}
          />
        )}
      </ArgonBox>
    ),
    id: trip.tripId,
  }));

  // Deleting the last row of a page shrinks totalCount below the page start.
  useEffect(() => {
    if (page > 0 && page * PAGE_SIZE >= totalCount) {
      setPage(Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1));
    }
  }, [totalCount, page]);

  const pageStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);
  const hasNext = pageEnd < totalCount;

  const editable = !!detail && EDITABLE_STATUSES.has(detail.trip.status);
  const running = detail?.trip.status === 'InProgress';
  // Deliveries and POD follow the backend rule ("not terminal"), not the
  // planning-only EDITABLE_STATUSES set: evidence is captured while running.
  const canWriteDeliveries = !!detail && !TERMINAL_STATUSES.has(detail.trip.status);

  return (
    <DashboardLayout>
      <DashboardNavbar
        searchVisibility
        searchQuery={search}
        handleSearch={(event) => {
          setPage(0);
          setSearch(event.target.value);
        }}
      />
      <ArgonBox py={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <ArgonBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <CompactSelect
                name="status"
                value={status}
                options={statusOptions}
                label={t('trips.filterStatus')}
                onChange={(_, value) => {
                  setPage(0);
                  setStatus(String(value));
                }}
              />
              <CompactSelect
                name="transporter"
                value={transporterFilter}
                options={transporterOptions}
                label={t('trips.filterTransporter')}
                onChange={(_, value) => {
                  setPage(0);
                  setTransporterFilter(String(value));
                }}
              />
              <CompactSelect
                name="driver"
                value={driverFilter}
                options={driverOptions}
                label={t('trips.filterDriver')}
                onChange={(_, value) => {
                  setPage(0);
                  setDriverFilter(String(value));
                }}
              />
              <ArgonBox width="190px">
                <CustomTextField
                  margin="none"
                  name="from"
                  id="from"
                  label={t('trips.filterFrom')}
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setPage(0);
                    setFrom(event.target.value);
                  }}
                />
              </ArgonBox>
              <ArgonBox width="190px">
                <CustomTextField
                  margin="none"
                  name="to"
                  id="to"
                  label={t('trips.filterTo')}
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setPage(0);
                    setTo(event.target.value);
                  }}
                />
              </ArgonBox>
              <ArgonButton variant="gradient" color="info" size="small" onClick={() => openTrip(false)}>
                <Icon>add</Icon>&nbsp;{t('trips.newTrip')}
              </ArgonButton>
              {/* Account-scoped transporter → toll-class mapping. It sits here,
                  not in the SuperAdministrator toll catalog: it is tenant data
                  under Resources.Trips/Edit, and this is the only route already
                  gated by the trip-management feature key (spec 11 §4, §7.6). */}
              <ArgonButton
                variant="outlined"
                color="dark"
                size="small"
                onClick={openTollClasses}
              >
                <Icon>local_shipping</Icon>&nbsp;{t('tolls.transporterClass.action')}
              </ArgonButton>
            </ArgonBox>
          </Grid>

          {/* MASTER over DETAIL: the board takes the full width on top, the trip
              workspace the full width underneath.

              Side by side, neither half had room — six columns collided inside a
              one-third-width board, while the map, stop tables and POD gallery
              were squeezed into the remaining two thirds. Stacking them gives
              both the whole window, and the board is short enough (10 rows) that
              the workspace below still starts above the fold. */}
          <Grid size={{ xs: 12 }}>
            <ArgonTypography variant="button" fontWeight="medium">
              {t('trips.board')}
            </ArgonTypography>
            {rows.length === 0 ? (
              <ArgonTypography variant="caption" color="secondary" display="block">
                {t('trips.noTrips')}
              </ArgonTypography>
            ) : (
              <Table
                columns={columns}
                rows={rows}
                compact
                scrollable
                /* Kept even at full width: the default `tableLayout: fixed; width: 100%` divides
                   space evenly regardless of content, and `scrollable` alone sets
                   `overflowX: hidden`, which clips the container without stopping cells from
                   colliding. `horizontalScroll` sizes columns to their content, so a narrow
                   viewport scrolls sideways instead of overlapping. */
                horizontalScroll
                /* Fits the 10-row page without scrolling; a wrapped cell scrolls slightly rather
                   than pushing the workspace below off screen. */
                maxHeight="440px"
                selectedField="code"
                selected={trips.find((trip) => trip.tripId === selectedTripId)?.code ?? null}
                handleSelected={(code) =>
                  setSelectedTripId(trips.find((trip) => trip.code === code)?.tripId ?? null)
                }
              />
            )}
            <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <ArgonTypography variant="caption" color="secondary">
                {t('trips.showing', { from: pageStart, to: pageEnd, total: totalCount })}
              </ArgonTypography>
              <ArgonPagination>
                <ArgonPagination item onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <Icon>keyboard_arrow_left</Icon>
                </ArgonPagination>
                <ArgonPagination item onClick={() => hasNext && setPage((p) => p + 1)} disabled={!hasNext}>
                  <Icon>keyboard_arrow_right</Icon>
                </ArgonPagination>
              </ArgonPagination>
            </ArgonBox>

          </Grid>

          {/* The workspace gets the full width too — the planner map, the stop and
              delivery tables and the POD gallery are the widest content on the
              screen and were the things most starved by the old split. */}
          <Grid size={{ xs: 12 }}>
            {!detail ? (
              <ArgonTypography variant="caption" color="secondary">
                {t('trips.selectTripHint')}
              </ArgonTypography>
            ) : (
              <ArgonBox>
                <ArgonBox display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
                  <ArgonTypography variant="h5" fontWeight="medium">
                    {detail.trip.code}
                  </ArgonTypography>
                  <ArgonBadge
                    variant="gradient"
                    color={statusColor(detail.trip.status)}
                    size="sm"
                    container
                    badgeContent={t(
                      `trips.statuses.${detail.trip.status}` as 'trips.statuses.Created'
                    )}
                  />
                  {detail.trip.deviationOpenedAt && (
                    <ArgonTypography variant="caption" color="error">
                      {t('trips.deviationSince', {
                        since: formatDateTime(detail.trip.deviationOpenedAt),
                      })}
                    </ArgonTypography>
                  )}
                  <ArgonBox flexGrow={1} />
                  {detail.trip.status === 'Created' && (
                    <ArgonButton variant="gradient" color="success" size="small" onClick={() => runLifecycle('start')}>
                      <Icon>play_arrow</Icon>&nbsp;{t('trips.actions.start')}
                    </ArgonButton>
                  )}
                  {running && (
                    <>
                      <ArgonButton variant="outlined" color="warning" size="small" onClick={() => runLifecycle('pause')}>
                        <Icon>pause</Icon>&nbsp;{t('trips.actions.pause')}
                      </ArgonButton>
                      <ArgonButton
                        variant="gradient"
                        color="success"
                        size="small"
                        onClick={() => {
                          setForceComplete(false);
                          setCompleteOpen(true);
                        }}
                      >
                        <Icon>flag</Icon>&nbsp;{t('trips.actions.complete')}
                      </ArgonButton>
                    </>
                  )}
                  {detail.trip.status === 'Paused' && (
                    <ArgonButton variant="gradient" color="info" size="small" onClick={() => runLifecycle('resume')}>
                      <Icon>play_arrow</Icon>&nbsp;{t('trips.actions.resume')}
                    </ArgonButton>
                  )}
                  <ArgonButton variant="outlined" color="dark" size="small" onClick={() => openTrip(true)}>
                    <Icon>edit</Icon>&nbsp;{t('generic.edit')}
                  </ArgonButton>
                  <ArgonButton variant="outlined" color="info" size="small" onClick={() => setShareOpen(true)}>
                    <Icon>share</Icon>&nbsp;{t('trips.actions.share')}
                  </ArgonButton>
                  {['Created', 'InProgress', 'Paused'].includes(detail.trip.status) && (
                    <>
                      <ArgonButton
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          setReason('');
                          setReasonAction('cancel');
                        }}
                      >
                        {t('trips.actions.cancel')}
                      </ArgonButton>
                      {running && (
                        <ArgonButton
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => {
                            setReason('');
                            setReasonAction('abort');
                          }}
                        >
                          {t('trips.actions.abort')}
                        </ArgonButton>
                      )}
                    </>
                  )}
                  {detail.trip.status === 'Created' && (
                    <ArgonButton variant="text" color="error" size="small" onClick={() => setConfirmDelete(true)}>
                      <Icon>delete</Icon>&nbsp;{t('trips.actions.delete')}
                    </ArgonButton>
                  )}
                </ArgonBox>

                <Tabs
                  value={workspaceTab}
                  onChange={(_, value: WorkspaceTab) => setWorkspaceTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 2 }}
                >
                  {WORKSPACE_TABS.map((tab) => (
                    <Tab
                      key={tab}
                      value={tab}
                      label={t(`trips.workspace.${tab}` as 'trips.workspace.route')}
                    />
                  ))}
                </Tabs>

                {/* Every panel below is keyed by trip id so switching trips
                    REMOUNTS it. Each holds trip-specific `useState` seeded once,
                    at mount. The surrounding `{!detail ? … }` ternary looks like
                    it unmounts them between trips, but it does not: TanStack
                    serves a previously visited trip's detail from cache
                    synchronously, so `detail` never goes undefined on the way
                    back and the panel keeps the PREVIOUS trip's values while
                    displaying the new one. That is not cosmetic — Assign then
                    writes trip A's driver onto trip B, and Replan applies A's
                    corridor width. */}
                {workspaceTab === 'route' && (
                  <RoutePlanner
                    key={detail.trip.tripId}
                    stops={detail.stops}
                    routePlan={detail.routePlan}
                    pois={pois}
                    mapType={mapSettings.maps}
                    mapKey={mapSettings.mapsKey}
                    darkMode={darkMode}
                    placing={placing}
                    onMapClick={handleMapClick}
                    onAddStop={() => openStop()}
                    onEditStop={openStop}
                    onRemoveStop={(tripStopId) => removeStop.mutate(tripStopId)}
                    onReorder={(orderedStopIds) =>
                      reorderStops.mutate({ tripId: detail.trip.tripId, orderedStopIds })
                    }
                    onPlanRoute={(corridorMeters) =>
                      planRoute.mutate({
                        tripId: detail.trip.tripId,
                        corridorMeters: corridorMeters || DEFAULT_CORRIDOR_METERS,
                        tollVehicleClass: detail.trip.tollVehicleClass,
                      })
                    }
                    planning={planRoute.isPending}
                    editable={editable}
                  />
                )}

                {workspaceTab === 'assignment' && (
                  <AssignmentPanel
                    key={detail.trip.tripId}
                    detail={detail}
                    drivers={drivers}
                    transporters={transporters}
                    onAssign={(driverId, transporterId) =>
                      assignTrip.mutate({ tripId: detail.trip.tripId, driverId, transporterId })
                    }
                    assigning={assignTrip.isPending}
                    editable={detail.trip.status !== 'Completed'}
                  />
                )}

                {workspaceTab === 'tolls' && (
                  <TollPanel
                    key={detail.trip.tripId}
                    routePlan={detail.routePlan}
                    vehicleClasses={vehicleClasses}
                    tripVehicleClass={detail.trip.tollVehicleClass}
                  />
                )}

                {(workspaceTab === 'stops' ||
                  workspaceTab === 'pod' ||
                  workspaceTab === 'timeline' ||
                  workspaceTab === 'replay') && (
                  <TripDetail
                    section={workspaceTab}
                    detail={detail}
                    mapType={mapSettings.maps}
                    mapKey={mapSettings.mapsKey}
                    darkMode={darkMode}
                    onStopAction={handleStopAction}
                    canRecordProgress={!!running}
                    onRecordPod={openPod}
                    onAddDelivery={(tripStopId) => openDelivery(tripStopId)}
                    onEditDelivery={(delivery) => openDelivery(delivery.tripStopId, delivery)}
                    onDeliveryOutcome={openOutcome}
                    onDeleteDelivery={setDeleteDeliveryTarget}
                    canWriteDeliveries={canWriteDeliveries}
                  />
                )}
              </ArgonBox>
            )}
          </Grid>

        </Grid>
      </ArgonBox>
      <Footer />

      <TripDialog
        open={tripOpen}
        setOpen={setTripOpen}
        handleSubmit={saveTrip}
        values={tripValues}
        handleChange={tripChange}
        errors={tripErrors}
        transporters={transporters}
        drivers={drivers}
        vehicleClasses={vehicleClasses}
      />

      <StopDialog
        open={stopOpen}
        setOpen={setStopOpen}
        handleSubmit={saveStop}
        handleCancel={() => setPlacing(false)}
        values={stopValues}
        handleChange={stopChange}
        errors={stopErrors}
        pois={pois}
        geofences={geofences}
        onPlaceOnMap={startPlacing}
      />

      {detail && <ShareDialog open={shareOpen} setOpen={setShareOpen} detail={detail} />}

      <DeliveryDialog
        open={deliveryOpen}
        setOpen={setDeliveryOpen}
        handleSubmit={saveDelivery}
        values={deliveryValues}
        handleChange={deliveryChange}
        errors={deliveryErrors}
        stopLabel={stopLabel(deliveryValues.tripStopId)}
      />

      <DeliveryOutcomeDialog
        open={!!outcomeDelivery}
        setOpen={() => setOutcomeDelivery(null)}
        handleSubmit={saveOutcome}
        deliveryLabel={
          outcomeDelivery
            ? [outcomeDelivery.clientName, outcomeDelivery.reference].filter(Boolean).join(' · ')
            : ''
        }
        status={outcomeStatus}
        onStatusChange={setOutcomeStatus}
        observations={outcomeObservations}
        onObservationsChange={setOutcomeObservations}
      />

      <ConfirmDialog
        title={t('trips.deliveries.deleteTitle')}
        message={t('trips.deliveries.deleteMessage')}
        open={!!deleteDeliveryTarget}
        setOpen={() => setDeleteDeliveryTarget(null)}
        onConfirm={async () => {
          if (deleteDeliveryTarget) {
            await deleteDelivery
              .mutateAsync(deleteDeliveryTarget.deliveryId)
              .catch(() => undefined);
          }
          setDeleteDeliveryTarget(null);
        }}
      />

      <PodDialog
        open={podOpen}
        setOpen={setPodOpen}
        handleSubmit={savePod}
        values={podValues}
        handleChange={podChange}
        errors={podErrors}
        stopLabel={stopLabel(podValues.tripStopId)}
        deliveries={
          detail?.stops.find((stop) => stop.tripStopId === podValues.tripStopId)?.deliveries ?? []
        }
        attachments={podAttachments}
        onUploadFiles={uploadPodFiles}
        onRemoveAttachment={(documentId) =>
          setPodAttachments((previous) =>
            previous.filter((attachment) => attachment.documentId !== documentId)
          )
        }
        onRefreshAttachment={refreshPodAttachment}
        uploading={uploadDocument.isPending}
      />

      <TollClassDialog
        open={tollClassOpen}
        setOpen={setTollClassOpen}
        handleSubmit={saveTollClass}
        values={tollClassValues}
        handleChange={tollClassChange}
        errors={tollClassErrors}
        transporters={transporters}
        vehicleClasses={vehicleClasses}
        savedMappings={savedTollClasses}
        saving={setTransporterTollClass.isPending}
      />

      <ConfirmDialog
        title={t('trips.deleteTitle')}
        message={t('trips.deleteMessage')}
        open={confirmDelete}
        setOpen={setConfirmDelete}
        onConfirm={async () => {
          if (selectedTripId) {
            await deleteTrip.mutateAsync(selectedTripId).catch(() => undefined);
            setSelectedTripId(null);
          }
          setConfirmDelete(false);
        }}
      />

      <FormDialog
        title={reasonAction === 'abort' ? t('trips.abortTitle') : t('trips.cancelTitle')}
        open={!!reasonAction}
        setOpen={() => setReasonAction(null)}
        handleSave={async () => {
          if (!selectedTripId || !reasonAction || !reason.trim()) return;
          await lifecycle
            .mutateAsync({ action: reasonAction, tripId: selectedTripId, reason })
            .catch(() => undefined);
          setReasonAction(null);
        }}
      >
        <ArgonTypography variant="caption" color="secondary">
          {reasonAction === 'abort' ? t('trips.abortMessage') : t('trips.cancelMessage')}
        </ArgonTypography>
        <CustomTextField
          autoFocus
          margin="normal"
          name="reason"
          id="reason"
          label={t('trips.reasonTitle')}
          type="text"
          multiline
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </FormDialog>

      <FormDialog
        title={t('trips.completeTitle')}
        open={completeOpen}
        setOpen={setCompleteOpen}
        handleSave={async () => {
          if (!selectedTripId) return;
          await lifecycle
            .mutateAsync({ action: 'complete', tripId: selectedTripId, force: forceComplete })
            .catch(() => undefined);
          setCompleteOpen(false);
        }}
      >
        <ArgonTypography variant="caption" color="secondary">
          {t('trips.completeMessage')}
        </ArgonTypography>
        <CustomCheckbox
          name="forceComplete"
          id="forceComplete"
          value={forceComplete}
          label={t('trips.forceComplete')}
          handleChange={(event) => setForceComplete(!!event.target.checked)}
        />
      </FormDialog>

      <FormDialog
        title={t('tripStops.skipTitle')}
        open={!!skipStopId}
        setOpen={() => setSkipStopId(null)}
        handleSave={async () => {
          if (!selectedTripId || !skipStopId || !skipReason.trim()) return;
          await stopProgress
            .mutateAsync({
              action: 'skip',
              tripId: selectedTripId,
              tripStopId: skipStopId,
              occurredAt: new Date().toISOString(),
              clientEventId: newClientEventId(),
              reason: skipReason,
            })
            .catch(() => undefined);
          setSkipStopId(null);
        }}
      >
        <ArgonTypography variant="caption" color="secondary">
          {t('tripStops.skipMessage')}
        </ArgonTypography>
        <CustomTextField
          autoFocus
          margin="normal"
          name="skipReason"
          id="skipReason"
          label={t('tripStops.skipReason')}
          type="text"
          value={skipReason}
          onChange={(event) => setSkipReason(event.target.value)}
          required
        />
      </FormDialog>
    </DashboardLayout>
  );
}

export default TripManager;
