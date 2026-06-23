# SessionsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**sessionsControllerCreate**](#sessionscontrollercreate) | **POST** /sessions | |
|[**sessionsControllerFindAll**](#sessionscontrollerfindall) | **GET** /sessions | |
|[**sessionsControllerFindOne**](#sessionscontrollerfindone) | **GET** /sessions/{id} | |
|[**sessionsControllerRemove**](#sessionscontrollerremove) | **DELETE** /sessions/{id} | |

# **sessionsControllerCreate**
> SessionDto sessionsControllerCreate(createSessionDto)


### Example

```typescript
import {
    SessionsApi,
    Configuration,
    CreateSessionDto
} from './api';

const configuration = new Configuration();
const apiInstance = new SessionsApi(configuration);

let createSessionDto: CreateSessionDto; //

const { status, data } = await apiInstance.sessionsControllerCreate(
    createSessionDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createSessionDto** | **CreateSessionDto**|  | |


### Return type

**SessionDto**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsControllerFindAll**
> Array<SessionDto> sessionsControllerFindAll()


### Example

```typescript
import {
    SessionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SessionsApi(configuration);

const { status, data } = await apiInstance.sessionsControllerFindAll();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<SessionDto>**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsControllerFindOne**
> SessionDto sessionsControllerFindOne()


### Example

```typescript
import {
    SessionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SessionsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.sessionsControllerFindOne(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**SessionDto**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsControllerRemove**
> DeleteResultDto sessionsControllerRemove()


### Example

```typescript
import {
    SessionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SessionsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.sessionsControllerRemove(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**DeleteResultDto**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

