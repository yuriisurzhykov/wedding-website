import {NextResponse} from "next/server";

import {submitRsvp} from "@features/rsvp-submit";

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {error: "invalid_json", message: "Request body must be valid JSON"},
            {status: 400},
        );
    }

    const result = await submitRsvp(body);

    if (result.ok) {
        return NextResponse.json({ok: true}, {status: 200});
    }

    if (result.kind === "validation") {
        return NextResponse.json(
            {
                error: "validation",
                fieldErrors: result.fieldErrors,
                formErrors: result.formErrors,
            },
            {status: 400},
        );
    }

    console.error("[api/rsvp]", result.kind, result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
