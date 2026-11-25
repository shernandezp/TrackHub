// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

namespace TrackHub.Security.Application.Users.Commands.CreateManager;

public sealed class CreateManagerCommandValidator : AbstractValidator<CreateManagerCommand>
{
    private readonly IUserReader _userReader;

    public CreateManagerCommandValidator(IUserReader userReader)
    {
        _userReader = userReader;

        RuleFor(v => v.AccountId)
            .NotEmpty();

        RuleFor(v => v.User.FirstName)
            .NotEmpty();

        RuleFor(v => v.User.LastName)
            .NotEmpty();

        RuleFor(v => v.User.Username)
            .MaximumLength(ColumnMetadata.DefaultUserNameLength)
            .NotEmpty()
            // Usernames carry a global unique index (ix_users_username).
            .MustAsync(ValidateUsername)
            .WithMessage("Username already in use");

        RuleFor(v => v.User.Password)
            .MinimumLength(ColumnMetadata.MinimumPasswordLength)
            .MaximumLength(ColumnMetadata.DefaultPasswordLength)
            .NotEmpty();

        RuleFor(v => v.User.EmailAddress)
            .EmailAddress()
            .MaximumLength(ColumnMetadata.DefaultEmailLength)
            .NotEmpty()
            .MustAsync(ValidateEmailAddress)
            .WithMessage("Email address already in use");
    }

    private async Task<bool> ValidateEmailAddress(string emailAddress, CancellationToken cancellationToken)
        => await _userReader.ValidateEmailAddressAsync(emailAddress, cancellationToken);

    private async Task<bool> ValidateUsername(string username, CancellationToken cancellationToken)
        => await _userReader.ValidateUsernameAsync(Guid.Empty, username, cancellationToken);

}
