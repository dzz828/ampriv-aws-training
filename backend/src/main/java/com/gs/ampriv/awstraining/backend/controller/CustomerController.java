package com.gs.ampriv.awstraining.backend.controller;

import com.gs.ampriv.awstraining.backend.service.api.CustomerService;
import com.gs.ampriv.awstraining.backend.service.api.CustomerView;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/account")
@AllArgsConstructor
public class CustomerController {
    private final CustomerService customerService;

    @PutMapping("/create")
    public Mono<CustomerView> create(@Valid @RequestBody CustomerView newAccountRequest) {
        return customerService.add(newAccountRequest);
    }

    @GetMapping("/all")
    public Mono<List<CustomerView>> all() {
        return customerService.all().collectList();
    }
}
