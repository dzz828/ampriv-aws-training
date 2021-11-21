package com.gs.ampriv.awstraining.backend.service.api;

import lombok.Builder;
import lombok.Value;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;

@Value
@Builder
public class CustomerView {
    @NotEmpty
    String customerID;
    @NotEmpty
    String name;
    @Email
    String email;
}
