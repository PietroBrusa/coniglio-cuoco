# AuthApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authControllerLogin**](#authcontrollerlogin) | **POST** /auth/login | |
|[**authControllerRegister**](#authcontrollerregister) | **POST** /auth/register | |

# **authControllerLogin**
> AuthResponseDto authControllerLogin(authCredentialsDto)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthCredentialsDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let authCredentialsDto: AuthCredentialsDto; //

const { status, data } = await apiInstance.authControllerLogin(
    authCredentialsDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authCredentialsDto** | **AuthCredentialsDto**|  | |


### Return type

**AuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authControllerRegister**
> AuthResponseDto authControllerRegister(authCredentialsDto)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    AuthCredentialsDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let authCredentialsDto: AuthCredentialsDto; //

const { status, data } = await apiInstance.authControllerRegister(
    authCredentialsDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authCredentialsDto** | **AuthCredentialsDto**|  | |


### Return type

**AuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

