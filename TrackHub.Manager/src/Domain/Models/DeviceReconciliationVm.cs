// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

namespace TrackHub.Manager.Domain.Models;

/// <summary>
/// One provider catalog reconciled against the operator's devices: <see cref="Devices"/> mirrors
/// the incoming catalog order, <see cref="Added"/> are the devices created or revived by it, and
/// <see cref="Retired"/> the ones the catalog no longer lists.
/// </summary>
public readonly record struct DeviceReconciliationVm(
    IReadOnlyList<DeviceVm> Devices,
    IReadOnlyList<DeviceVm> Added,
    IReadOnlyList<DeviceVm> Retired);
