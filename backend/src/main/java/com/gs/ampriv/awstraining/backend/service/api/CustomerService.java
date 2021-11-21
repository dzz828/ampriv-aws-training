package com.gs.ampriv.awstraining.backend.service.api;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerService {
    Mono<CustomerView> add(CustomerView customer);
    Flux<CustomerView> all();
}
