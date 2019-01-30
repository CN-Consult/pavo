/**
 * @file
 * @version 0.1
 * @copyright 2018 CN-Consult GmbH
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Merges two objects into a single object.
 */
class ObjectMerger
{
    /**
     * Merges two objects.
     *
     * @param {Object} _baseObject The object that will be used as the base for the result object
     * @param {Object} _overwriteObject The object whose values will be added to the result object and that overwrite the base object values in case of duplicated property indexes
     * @param {Boolean} _mergeArrays If true array properties will be merged, else arrays will be replaced
     *
     * @return {Object} The result object
     */
    mergeObjects(_baseObject, _overwriteObject, _mergeArrays)
    {
        // Clone the base object and use it as base result object
        let resultObject = Object.assign({}, _baseObject);

        // Iterate over all properties of the overwriting object
        for (let _propertyIndex in _overwriteObject)
        {
            if (_overwriteObject.hasOwnProperty(_propertyIndex))
            { // The property index is not one of its prototypes properties

                let propertyValue = _overwriteObject[_propertyIndex];

                if (resultObject.hasOwnProperty(_propertyIndex))
                {
                    // TODO: Merge sub objects?
                    // TODO: Add parameter: only merge properties that exist in base object
                    if (Array.isArray(propertyValue) && _mergeArrays)
                    {
                        // TODO: Remove duplicate values?
                        resultObject[_propertyIndex] = resultObject[_propertyIndex].concat(propertyValue);
                    }
                    else resultObject[_propertyIndex] = propertyValue;
                }
                else resultObject[_propertyIndex] = propertyValue;
            }
        }

        return resultObject;
    }
}


module.exports = ObjectMerger;
