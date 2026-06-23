# CreateSessionDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**childId** | **string** |  | [optional] [default to undefined]
**sessionNumber** | **number** |  | [default to undefined]
**food** | **string** |  | [default to undefined]
**foodId** | **string** |  | [optional] [default to undefined]
**difficulty** | **string** |  | [optional] [default to undefined]
**date** | **string** |  | [default to undefined]
**levels** | [**Array&lt;LevelResultDto&gt;**](LevelResultDto.md) |  | [default to undefined]

## Example

```typescript
import { CreateSessionDto } from './api';

const instance: CreateSessionDto = {
    childId,
    sessionNumber,
    food,
    foodId,
    difficulty,
    date,
    levels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
