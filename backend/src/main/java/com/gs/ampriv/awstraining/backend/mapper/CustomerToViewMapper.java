package com.gs.ampriv.awstraining.backend.mapper;

import com.gs.ampriv.awstraining.backend.domain.Customer;
import com.gs.ampriv.awstraining.backend.service.api.CustomerView;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CustomerToViewMapper {
    CustomerView toView(Customer customer);
    Customer fromView(CustomerView customerView);
}
