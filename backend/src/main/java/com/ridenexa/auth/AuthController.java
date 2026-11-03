package com.ridenexa.auth;

import com.ridenexa.auth.AuthDtos.CustomerRegistration;
import com.ridenexa.auth.AuthDtos.LoginRequest;
import com.ridenexa.auth.AuthDtos.OwnerRegistration;
import com.ridenexa.auth.AuthDtos.StaffRegistration;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final CurrentUser currentUser;

    public AuthController(AuthService auth, CurrentUser currentUser) {
        this.auth = auth;
        this.currentUser = currentUser;
    }

    @PostMapping("/register/customer")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerCustomer(@Valid @RequestBody CustomerRegistration input) {
        return auth.registerCustomer(input);
    }

    @PostMapping("/register/owner")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerOwner(@Valid @RequestBody OwnerRegistration input) {
        return auth.registerOwner(input);
    }

    @PostMapping("/register/delivery")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerDelivery(@Valid @RequestBody StaffRegistration input) {
        return auth.registerDelivery(input);
    }

    @PostMapping("/register/driver")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerDriver(@Valid @RequestBody StaffRegistration input) {
        return auth.registerDriver(input);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest input) {
        return auth.login(input);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        UserSession user = currentUser.require();
        return auth.me(user.id());
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@Valid @RequestBody AuthDtos.UpdateProfileRequest input) {
        UserSession user = currentUser.require();
        return auth.updateProfile(user.id(), input);
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@Valid @RequestBody AuthDtos.ChangePasswordRequest input) {
        UserSession user = currentUser.require();
        return auth.changePassword(user.id(), input);
    }
}
