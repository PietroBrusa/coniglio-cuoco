# CreateSessionDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**childId** | **string** |  | [optional] [default to undefined]
**sessionNumber** | **number** |  | [default to undefined]
**food** | **string** |  | [default to undefined]
**foodId** | **string** |  | [optional] [default to undefined]
**difficulty** | **string** |  | [optional] [default to undefined]
**therapist** | **string** |  | [optional] [default to undefined]
**problemBehaviors** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**notes** | **string** |  | [optional] [default to undefined]
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
    therapist,
    problemBehaviors,
    notes,
    date,
    levels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
