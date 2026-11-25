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

using Common.Domain.Time;
namespace TrackHub.Manager.Application.Accounts.Commands.UpdateMaster;

// The cross-tenant twin of UpdateAccountCommand, which stays guarded to the caller's own account.
[Authorize(Resource = Resources.AccountsMaster, Action = Actions.Edit)]
[AllowCrossAccount("Platform account administration: the systemadmin console maintains accounts other than the operator's own. Gated by the Administrator-only AccountsMaster/Edit permission.")]
public readonly record struct UpdateAccountMasterCommand(UpdateAccountDto Account) : IRequest;

public class UpdateAccountMasterCommandHandler(IAccountWriter writer) : IRequestHandler<UpdateAccountMasterCommand>
{
    public async Task Handle(UpdateAccountMasterCommand request, CancellationToken cancellationToken)
        => await writer.UpdateAccountAsync(request.Account, cancellationToken);
}

public sealed class UpdateAccountMasterValidator : AbstractValidator<UpdateAccountMasterCommand>
{
    public UpdateAccountMasterValidator()
    {
        RuleFor(v => v.Account)
            .NotEmpty();

        RuleFor(v => v.Account.AccountId)
            .NotEmpty();

        RuleFor(v => v.Account.Name)
            .NotEmpty();

        RuleFor(v => v.Account.TypeId)
            .NotEmpty();

        RuleFor(v => v.Account.TimeZoneId)
            .Must(AccountTimeZone.IsValid)
            .When(v => !string.IsNullOrWhiteSpace(v.Account.TimeZoneId))
            .WithMessage("Unknown time zone; use an IANA name such as America/Bogota.");
    }
}
