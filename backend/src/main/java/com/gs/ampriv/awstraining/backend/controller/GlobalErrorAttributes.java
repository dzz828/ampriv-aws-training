package com.gs.ampriv.awstraining.backend.controller;

import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GlobalErrorAttributes extends DefaultErrorAttributes {

    @Override
    public Throwable getError(ServerRequest request) {
        Throwable error = super.getError(request);

        if (error instanceof IllegalArgumentException) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, error.getMessage(), error);
        }

        return error;
    }
}
