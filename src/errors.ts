import status from "statuses";

export class YggdrasilError extends Error {
    public code: number;
    public type: string;
    public cause?: string;

    constructor(code: number = 500, type?: string, message?: string, cause?: string) {
        super(message);
        this.name = "YggdrasilError";
        this.code = code;
        this.type = type ?? status(code);
        this.cause = cause;
    }
}

export class InvalidTokenError extends YggdrasilError {
    constructor(message: string = "Invalid token.") {
        super(403, "ForbiddenOperationException", message);
    }
}

export class AuthenticationError extends YggdrasilError {
    constructor(message: string = "Invalid credentials. Invalid username or password.") {
        super(403, "ForbiddenOperationException", message);
    }
}

export class TokenAlreadyAssignedError extends YggdrasilError {
    constructor(message: string = "Access token already has a profile assigned.") {
        super(400, "IllegalArgumentException", message);
    }
}

export class UnownedProfileError extends YggdrasilError {
    constructor(message: string = "") {
        super(403, "ForbiddenOperationException", message);
    }
}

export class WrongProfileError extends YggdrasilError {
    constructor(message: string = "Invalid token.") {
        super(403, "ForbiddenOperationException", message);
    }
}
