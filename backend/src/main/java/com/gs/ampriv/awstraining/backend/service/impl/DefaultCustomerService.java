package com.gs.ampriv.awstraining.backend.service.impl;

import com.gs.ampriv.awstraining.backend.mapper.CustomerToViewMapper;
import com.gs.ampriv.awstraining.backend.repositories.CustomerRepository;
import com.gs.ampriv.awstraining.backend.service.api.CustomerService;
import com.gs.ampriv.awstraining.backend.service.api.CustomerView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
public class DefaultCustomerService implements CustomerService {
    private final CustomerRepository customerRepository;
    private final CustomerToViewMapper customerToViewMapper;

    @Override
    public Mono<CustomerView> add(CustomerView customer) {
        return Mono.fromCallable(() -> customerRepository.save(customerToViewMapper.fromView(customer)))
                .subscribeOn(Schedulers.boundedElastic())
                .map(customerToViewMapper::toView);
    }

    @Override
    public Flux<CustomerView> all() {
        return Mono.fromCallable(customerRepository::findAll)
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(Flux::fromIterable)
                .map(customerToViewMapper::toView);
    }
}
