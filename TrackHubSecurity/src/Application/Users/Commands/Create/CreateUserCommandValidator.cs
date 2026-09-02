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

namespace TrackHub.Security.Application.Users.Commands.Create;

public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    private readonly IUserReader _userReader;

    public CreateUserCommandValidator(IUserReader userReader)
    {
        _userReader = userReader;

        RuleFor(v => v.User.FirstName)
            .NotEmpty();

        RuleFor(v => v.User.LastName)
            .NotEmpty();

        RuleFor(v => v.User.Username)
            .MaximumLength(ColumnMetadata.DefaultUserNameLength)
            .NotEmpty()
            // Usernames carry a global unique index (ix_users_username); without this rule a duplicate
            // surfaced as a raw database error instead of a validation message.
            .MustAsync(ValidateUsername)
            .WithMessage("Username already in use");

        // Validate the minimum and maximum length, complexity, and non-empty of the password
        RuleFor(v => v.User.Password)
            .MinimumLength(ColumnMetadata.MinimumPasswordLength)
            .MaximumLength(ColumnMetadata.DefaultPasswordLength)
            .NotEmpty()
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.");

        // Validate the email address format, maximum length, non-empty, and uniqueness
        RuleFor(v => v.User.EmailAddress)
            .EmailAddress()
            .MaximumLength(ColumnMetadata.DefaultEmailLength)
            .NotEmpty()
            .MustAsync(ValidateEmailAddress)
            .WithMessage("Email address already in use");
    }

    // Asynchronously validate the uniqueness of the email address
    private async Task<bool> ValidateEmailAddress(string emailAddress, CancellationToken cancellationToken)
        => await _userReader.ValidateEmailAddressAsync(emailAddress, cancellationToken);

    // Asynchronously validate the uniqueness of the username (no user is excluded on create)
    private async Task<bool> ValidateUsername(string username, CancellationToken cancellationToken)
        => await _userReader.ValidateUsernameAsync(Guid.Empty, username, cancellationToken);

}
