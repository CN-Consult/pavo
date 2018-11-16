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
     * @param {Boolean} _appendNumericArrayIndexes If true numeric array index entries will be appended to the result array instead of overwriting existing array entries with the same index
     *
     * @return {Object} The result object
     */
    mergeObjects(_baseObject, _overwriteObject, _appendNumericArrayIndexes)
    {
        // Clone the base object and use it as base result object
        let resultObject = Object.assign({}, _baseObject);
        let self = this;

        // Iterate over all properties of the overwriting object
        for (let _propertyIndex in _overwriteObject)
        {
            if (_overwriteObject.hasOwnProperty(_propertyIndex))
            { // The property index is not one of its prototypes properties

                let propertyValue = _overwriteObject[_propertyIndex];

                if (resultObject.hasOwnProperty(_propertyIndex))
                {
                    // @todo: Merge sub objects?
                    // @todo: Add parameter: only merge properties that exist in base object
                    if (Array.isArray(propertyValue))
                    {
                        resultObject[_propertyIndex] = self.mergeArrays(resultObject[_propertyIndex], propertyValue, _appendNumericArrayIndexes);
                    }
                    else resultObject[_propertyIndex] = propertyValue;
                }
                else resultObject[_propertyIndex] = propertyValue;
            }

        }

        return resultObject;
    }

    /**
     * Merges two arrays.
     *
     * @param {Array} _baseArray The array that will be used as the base for the result array
     * @param _overwriteArray The array whose values will be added to the result array and that overwrite the base array values in case of duplicated property indexes
     * @param {Boolean} _appendNumericArrayIndexes If true numeric array index entries will be appended to the result array instead of overwriting existing array entries with the same index
     */
    mergeArrays(_baseArray, _overwriteArray, _appendNumericArrayIndexes)
    {
        // Clone the base array and use it as base result array
        let resultArray = JSON.parse(JSON.stringify(_baseArray));
        let self = this;

        // Iterate over all array entries of the overwriting array
        _overwriteArray.forEach(function(_arrayValue, _arrayIndex){

            if ((_appendNumericArrayIndexes && Number.isInteger(_arrayIndex)) || ! resultArray.hasOwnProperty(_arrayIndex))
            {
                // TODO: Check whether the array already contains the value before adding it
                resultArray.push(_arrayValue);
            }
            else
            {
                resultArray.push(self.mergeObjects(_arrayValue, resultArray[_arrayIndex], _appendNumericArrayIndexes));
            }
        });

        return resultArray;
    }
}


module.exports = ObjectMerger;
