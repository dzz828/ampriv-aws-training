package com.gs.ampriv.awstraining.backend.repositories;

import com.gs.ampriv.awstraining.backend.domain.Customer;
import org.socialsignin.spring.data.dynamodb.repository.DynamoDBCrudRepository;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.stereotype.Repository;

@Repository
@EnableScan
public interface CustomerRepository extends DynamoDBCrudRepository<Customer, String> {
}
