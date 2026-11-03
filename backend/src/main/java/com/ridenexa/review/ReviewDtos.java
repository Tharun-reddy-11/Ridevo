package com.ridenexa.review;

import jakarta.validation.constraints.*;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record CreateReviewRequest(
        @NotBlank String bookingId,
        @NotNull @Min(1) @Max(5) Integer rating,
        @NotBlank @Size(max = 1000) String comment
    ) {}

    public record ReplyReviewRequest(
        @NotBlank @Size(max = 1000) String reply
    ) {}
}
